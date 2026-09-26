# Audit de sécurité & passage à l'échelle — GenX

**Date** : 26 septembre 2026
**Périmètre** : fonctions Vercel (`api/`, `server/`), base Supabase (schéma, RLS, grants, fonctions), frontend (`src/`), CI/CD, configuration Vercel/Supabase.
**Statut** : toutes les failles listées ci-dessous sont corrigées dans le code et appliquées en production (migration `supabase/migrations/20260926_security_hardening.sql`), sauf les points de la section « Actions restantes » qui dépendent d'accès que seul le propriétaire possède.

---

## 1. Failles corrigées

| # | Gravité | Faille | Correctif |
|---|---------|--------|-----------|
| 1 | **Critique** | `profiles.plan` modifiable par l'utilisateur (RLS `UPDATE` sans restriction de colonnes) → n'importe qui pouvait s'offrir le plan Business depuis la console du navigateur. Le plan était d'ailleurs écrit côté client après Stripe. | Privilèges par colonne : `authenticated` ne peut modifier que `full_name`, `avatar_url`, `updated_at`. Le plan est écrit uniquement côté serveur (`server/stripe.ts` via service role) après vérification Stripe, ou par le webhook Stripe. |
| 2 | **Critique** | `/api/stripe/portal` acceptait un `customerId` arbitraire sans authentification → ouverture du portail de facturation d'un autre client (factures, annulation, moyen de paiement). | Authentification Supabase obligatoire ; le `customer_id` est résolu côté serveur depuis `subscriptions` de l'utilisateur connecté. |
| 3 | **Critique** | `CRON_SECRET` codé en dur dans `api/cron/publish-scheduled-pins.ts` et dans le workflow GitHub, dépôt **public**. En-tête `x-vercel-cron` accepté sans vérification. | Secret retiré du code (env obligatoire, comparaison en temps constant), workflow lit `${{ secrets.CRON_SECRET }}`. **Le secret doit être régénéré** (voir actions restantes). |
| 4 | **Élevée** | Vue `user_dashboard_stats` sans `security_invoker` et accessible à `anon`/`authenticated` → statistiques (plan, volumes) de **tous** les utilisateurs lisibles. | `security_invoker = true`, accès retiré à `anon`. |
| 5 | **Élevée** | Fonctions SQL `reset_monthly_pin_count`, `increment_pin_count`, `check_pin_limit` exécutables par tout utilisateur → remise à zéro de ses propres quotas. | `REVOKE EXECUTE` pour `anon`/`authenticated` ; compteurs maintenus par triggers `SECURITY DEFINER`. |
| 6 | **Élevée** | Aucune limite de plan appliquée : le quota de pins (10/100/∞) n'était qu'un affichage. | Trigger `pins_enforce_quota` (BEFORE INSERT) : refuse avec `PIN_LIMIT_REACHED` au-delà du plan ; compteur `pins_created_this_month` recalculé depuis les vraies lignes. Quotas IA journaliers par plan (`consume_quota`, table `api_usage`). |
| 7 | **Élevée** | `/api/ai/chat` relayait le corps brut vers OpenRouter : modèle, `max_tokens`, etc. choisis par le client → vidage du crédit IA avec des modèles coûteux. | Liste blanche de modèles, `max_tokens` ≤ 1500, ≤ 12 messages / 12 000 caractères, images validées, quota par utilisateur/jour, rate-limit IP. |
| 8 | **Élevée** | `/api/pinterest/oauth/token` et `/api/pinterest/proxy` sans authentification → utilisation de nos identifiants d'app Pinterest par des tiers, `redirect_uri` libre. | Session Supabase obligatoire ; `redirect_uri` doit être une URI enregistrée ; le token Pinterest passe dans `X-Pinterest-Token`. |
| 9 | **Élevée** | `/api/stripe/checkout` : `userId`, `email`, `successUrl`, `cancelUrl` fournis par le client → sessions au nom d'un autre compte, redirections ouvertes. | Identité prise dans le JWT ; URLs de retour limitées aux origines de l'app ; réutilisation du client Stripe existant. |
| 10 | **Moyenne** | Proxy d'images `GET /api/ai/image?proxy=` = SSRF/relais ouvert (toute URL https, tout contenu, pas de limite). | Résolution DNS + blocage des IP privées/link-local, https uniquement, redirections contrôlées, `Content-Type: image/*` (SVG exclu), 15 Mo max, timeout, rate-limit. |
| 11 | **Moyenne** | `/api/email/notify` public → spam de l'admin via Resend, adresse e-mail personnelle codée en dur. | Envoi uniquement si un compte `auth.users` avec cet e-mail a été créé dans les 15 dernières minutes (`signup_recently_created`, service role), rate-limit 5/10 min/IP, `ADMIN_EMAIL` obligatoire en env. |
| 12 | **Moyenne** | Secrets lus côté client (`VITE_PINTEREST_APP_SECRET`, `VITE_GROK_API_KEY`, `VITE_OPENROUTER_API_KEY`, `VITE_STRIPE_SECRET_KEY` acceptés côté serveur) : un secret nommé `VITE_*` finit dans le bundle public. | Toute lecture de secret retirée du frontend et des fallbacks serveur ; `vite-env.d.ts` ne déclare plus que des valeurs publiques. |
| 13 | **Moyenne** | Pas de webhook Stripe : annulation, impayé ou changement via le portail n'étaient jamais répercutés → accès payant conservé sans paiement. | `api/stripe/webhook.ts` (signature HMAC vérifiée, tolérance 5 min) : `checkout.session.completed`, `customer.subscription.*`, `invoice.paid/payment_failed`. Nécessite `STRIPE_WEBHOOK_SECRET`. |
| 14 | **Moyenne** | Table `subscriptions` : insert/update/delete par le client, pas d'unicité par utilisateur. | Écriture réservée au serveur (service role), index unique `user_id`, index sur `stripe_customer_id`/`stripe_subscription_id`. |
| 15 | **Moyenne** | Grants Postgres trop larges : `anon` avait INSERT/UPDATE/DELETE/TRUNCATE sur toutes les tables ; `authenticated` avait TRUNCATE/REFERENCES/TRIGGER ; `scheduled_jobs` et `pin_analytics` modifiables. | `REVOKE` global pour `anon`, retrait de TRUNCATE/REFERENCES/TRIGGER, `scheduled_jobs` serveur uniquement, `pin_analytics` lecture seule, `pins` : colonnes `id`/`user_id`/`created_at`/`locked_at` non modifiables. |
| 16 | **Moyenne** | Changement de mot de passe sans vérification du mot de passe actuel (champ affiché mais ignoré) ; longueur minimale 6. | Ré-authentification `signInWithPassword` avant `updateUser`, minimum 8 caractères, politique Supabase : 8 caractères + lettres + chiffres. |
| 17 | **Faible** | `state` OAuth Pinterest prévisible (`Date.now()` + `Math.random`). | 128 bits via `crypto.getRandomValues`. |
| 18 | **Faible** | Aucun en-tête de sécurité HTTP. | `vercel.json` : HSTS (preload), `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, CSP `frame-ancestors 'none'`/`object-src 'none'`/`form-action`. |
| 19 | **Faible** | Messages d'erreur serveur détaillés (stack, réponses brutes des fournisseurs) renvoyés au client. | Messages génériques côté client, détails uniquement dans les logs Vercel. |

## 2. Défauts fonctionnels bloquants corrigés

| Problème | Impact | Correctif |
|----------|--------|-----------|
| Toutes les images de pins étaient stockées en `data:image/jpeg;base64` (200–330 Ko par ligne) dans `pins.image_url`. Pinterest ne peut pas télécharger une `data:` URL → **aucune publication n'aurait fonctionné même avec l'accès Standard**. | Publication impossible ; base de données gonflée. | Bucket Storage public `pin-images` (5 Mo max, jpeg/png/webp, dossier par utilisateur protégé par RLS). Le client téléverse l'image composée et n'enregistre que l'URL publique (`src/lib/pinStorage.ts`). Les pins existants en `data:` sont envoyés à Pinterest en `image_base64` par le serveur. |
| Publication concurrente : GitHub cron (5 min), Vercel cron et le publieur intégré de chaque utilisateur pouvaient traiter le même pin en parallèle → doublons sur Pinterest. | Doublons, quotas Pinterest brûlés. | Verrou atomique `claim_pins_for_publishing` (colonne `locked_at`, expiration 3 min) + libération en `finally`. |
| Fonctions Vercel Hobby limitées à 10 s par défaut ; 50 pins séquentiels dépassaient le délai. | Runs tués à mi-chemin. | `maxDuration: 60` et budget temps interne (45 s) : les pins non traités sont libérés pour le run suivant. |
| `SchedulerWorker` appelait toutes les minutes une jointure `pinterest_accounts!inner` inexistante (erreur 400 en boucle) et publiait depuis le navigateur avec les tokens Pinterest. | Erreurs continues, tokens exposés au navigateur. | Le worker appelle le moteur serveur (`publishPinsNow`) toutes les 5 min ; code client de publication supprimé. |
| 4 plugins Vite dupliquaient la logique des API en dev (dérive de sécurité inévitable). | Comportement dev ≠ prod. | `vite.api-plugin.ts` exécute les vrais handlers `api/**.ts` en dev. |
| `/api/pinterest/credentials` appelé par le client alors que la fonction avait été supprimée. | Code mort / erreurs 404. | Supprimé. |
| Compteur `pinterest_accounts_connected` écrit par le client. | Incohérences. | Trigger sur `pinterest_accounts`. |
| Index manquants pour le cron (`status, scheduled_at`) et les quotas (`user_id, created_at`). | Requêtes de plus en plus lentes avec le volume. | Index ajoutés. |

## 3. Architecture de sécurité (état actuel)

```
Navigateur ──JWT Supabase──▶ /api/*  (auth obligatoire sauf /api/config, GET /api/ai/image?proxy, /api/email/notify, /api/stripe/webhook)
                              │
                              ├─ quotas par plan (consume_quota, RLS) + rate-limit IP/utilisateur
                              ├─ Stripe : identité = JWT ; plan écrit par service role uniquement
                              └─ Pinterest : secret d'app côté serveur ; redirect_uri contrôlé

GitHub Actions (*/5) ──Bearer CRON_SECRET──▶ /api/cron/publish-scheduled-pins ──service role──▶ tous les pins dus
Vercel Cron (1/jour, Hobby) ────────────────▶ idem (Vercel envoie automatiquement CRON_SECRET)
Stripe ──Stripe-Signature──▶ /api/stripe/webhook ──service role──▶ profiles.plan / subscriptions

Postgres : RLS sur toutes les tables + privilèges par colonne + triggers SECURITY DEFINER (quota, compteurs, verrou)
Storage  : bucket pin-images (lecture publique, écriture dans <user_id>/ uniquement)
```

## 4. Actions restantes (accès propriétaire requis)

Les jetons Vercel et GitHub fournis n'ont plus les droits nécessaires ; ces étapes sont à faire depuis les tableaux de bord :

1. **Régénérer `CRON_SECRET`** (l'ancien est public) : `openssl rand -base64 32`, puis
   - Vercel → Project → Settings → Environment Variables → `CRON_SECRET` (Production) → Redeploy.
   - GitHub → repo → Settings → Secrets and variables → Actions → `CRON_SECRET` (même valeur).
   Sans le secret GitHub, le workflow échoue volontairement (message explicite) ; le cron Vercel quotidien et le publieur intégré continuent de fonctionner.
2. **Webhook Stripe** : Dashboard Stripe → Developers → Webhooks → endpoint `https://www.pingenx.io/api/stripe/webhook`, événements `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed` → copier le `whsec_…` dans Vercel `STRIPE_WEBHOOK_SECRET`.
3. **`ADMIN_EMAIL`** dans Vercel si les notifications d'inscription doivent continuer (la valeur par défaut codée en dur a été retirée).
4. **Supprimer les variables `VITE_*` secrètes** de Vercel si elles existent (`VITE_GROK_API_KEY`, `VITE_OPENROUTER_API_KEY`, `VITE_PINTEREST_APP_SECRET`, `VITE_STRIPE_SECRET_KEY`) et n'utiliser que `GROK_API_KEY`/`XAI_API_KEY`, `OPENROUTER_API_KEY`, `PINTEREST_APP_SECRET`, `STRIPE_SECRET_KEY`.
5. **Révoquer** le jeton Supabase `sbp_…` et le jeton Vercel communiqués pendant l'intervention.
6. **Protection contre les mots de passe compromis (HIBP)** : disponible uniquement sur le plan Supabase Pro.
7. **Accès Standard Pinterest** (app 1609578) : toujours le seul blocage pour voir les pins apparaître sur Pinterest.

## 5. Ce qui est volontairement public

- `/api/config` : uniquement des booléens « intégration activée » et des identifiants publics (App ID Pinterest, clé publishable Stripe).
- `GET /api/ai/image?proxy=` : nécessaire au canvas (CORS) ; durci contre le SSRF et limité aux images.
- Bucket `pin-images` en lecture : Pinterest doit pouvoir télécharger les images ; les chemins contiennent un UUID aléatoire et l'écriture est restreinte au dossier de l'utilisateur.
