# GenX — Infrastructure, monitoring et maîtrise des coûts

Ce document décrit (1) la mise en place de Sentry et PostHog, (2) le passage derrière
Cloudflare, et (3) la grille tarifaire v2 avec ses plafonds, conçue pour que la facture
reste bornée quel que soit le comportement des utilisateurs.

---

## 1. Monitoring : Sentry (erreurs) + PostHog (produit)

Le code est déjà instrumenté. Rien ne s'active tant que les clés ne sont pas renseignées :
sans variables, aucun script tiers n'est chargé et aucune requête n'est envoyée.

### 1.1 Sentry

1. Créer un compte sur <https://sentry.io> (région **EU** → données hébergées à Francfort).
2. Créer deux projets dans la même organisation :
   - `genx-web` (plateforme *React*) → copier le DSN → `VITE_SENTRY_DSN`
   - `genx-api` (plateforme *Node.js*) → copier le DSN → `SENTRY_DSN`
3. Ajouter ces deux variables dans Vercel → *Settings → Environment Variables*
   (environnement **Production** ; Preview optionnel). Redéployer.

Ce qui est envoyé :

| Côté | Mécanisme | Contenu |
| --- | --- | --- |
| Navigateur | `@sentry/react` chargé à la volée (`src/lib/monitoring.ts`) | exceptions non gérées, `captureException` explicites, `release` = SHA du commit, `environment` = `production`/`preview`. Les erreurs métier attendues (`QUOTA_EXCEEDED`, `SESSION_EXPIRED`, `AUTOPILOT_*`…) sont ignorées. Pas de session replay, pas de tracing (quota gratuit préservé). |
| Fonctions Vercel | `server/sentry.ts` (envoi direct d'une *envelope*, zéro dépendance) | erreurs des routes `api/*` avec `route`, `userId` (UUID, pas d'e-mail), tags et contexte. |

Le plan gratuit (5 000 erreurs/mois) suffit largement pour > 100 utilisateurs.

### 1.2 PostHog

1. Créer un compte sur <https://eu.posthog.com> (**EU Cloud**).
2. Créer le projet « GenX » → *Project API key* (`phc_…`) → `VITE_POSTHOG_KEY`.
3. `VITE_POSTHOG_HOST` reste `https://eu.i.posthog.com` (valeur par défaut dans le code).
4. Ajouter dans Vercel, redéployer.

Réglages de confidentialité appliqués dans le code (`src/lib/monitoring.ts`) :

- **cookieless** : `persistence: 'memory'` → pas de bandeau cookies nécessaire pour l'analytics ;
- `person_profiles: 'identified_only'` → les visiteurs anonymes de la landing ne créent pas de profil ;
- autocapture désactivé, saisies masquées, pas d'IP stockée ;
- identification uniquement après connexion (`identifyUser` : id, plan, langue), reset à la déconnexion.

Événements suivis (`AnalyticsEvent`) : `signup_completed`, `login_completed`, `pin_generated`,
`pin_saved`, `pin_published_manually`, `autopilot_toggled`, `autopilot_generate_now`,
`pinterest_connected`, `checkout_started`, `plan_activated`, `subscription_cancelled`,
`language_changed`, `quota_hit` + pageviews SPA.

Tableaux de bord recommandés à créer dans PostHog :

1. **Funnel d'activation** : `signup_completed` → `pinterest_connected` → `pin_generated` → `pin_saved`.
2. **Funnel de conversion** : `quota_hit` → `checkout_started` → `plan_activated`.
3. **Rétention hebdomadaire** sur `pin_generated`.

> À mettre à jour dans la politique de confidentialité : ajouter Sentry (Functional Software Inc., EU)
> et PostHog (PostHog Inc., EU Cloud) à la liste des sous-traitants.

---

## 2. Cloudflare devant Vercel

Objectif : cache statique, protection bot/DDoS et limitation de débit **avant** d'atteindre les
fonctions Vercel (qui sont facturées à l'invocation en plan Pro).

### 2.1 Pré-requis dans le code (déjà fait)

- `server/http.ts` → `clientIp()` lit `cf-connecting-ip` en priorité (le *rate limiting* applicatif
  et l'anti-abus continuent de voir la vraie IP du visiteur, pas celle de Cloudflare).
- Aucune dépendance aux en-têtes `x-vercel-*` côté sécurité.

### 2.2 Étapes (≈ 20 min, à faire par le propriétaire du domaine)

1. **Ajouter le site** `pingenx.io` dans Cloudflare (plan **Free**). Cloudflare importe les
   enregistrements DNS existants : vérifier qu'ils correspondent au tableau ci-dessous.
2. **DNS** (proxy orange activé sur les deux) :

   | Type | Nom | Valeur | Proxy |
   | --- | --- | --- | --- |
   | A | `@` | `76.76.21.21` | ✅ Proxied |
   | CNAME | `www` | `cname.vercel-dns.com` | ✅ Proxied |

   Conserver tels quels les enregistrements MX/TXT (Resend, DMARC, vérification Pinterest…).
3. **Changer les serveurs de noms** chez le registrar vers ceux fournis par Cloudflare
   (propagation : quelques minutes à 24 h). Vercel continue de servir le site pendant la bascule.
4. **SSL/TLS** → mode **Full (strict)**. Activer *Always Use HTTPS* et *Automatic HTTPS Rewrites*.
   Ne **pas** activer *Universal SSL* en mode « Flexible » (boucles de redirection avec Vercel).
5. **Règles de cache** (*Caching → Cache Rules*) :
   - `Bypass cache` si l'URI commence par `/api/` (fonctions dynamiques, Stripe, Pinterest).
   - `Cache everything` + *Edge TTL 1 an* si l'URI commence par `/assets/` (bundles immuables, déjà `Cache-Control: immutable`).
   - Laisser `/index.html` et `/` en comportement par défaut (respecte les en-têtes Vercel).
6. **Sécurité** :
   - *Security → Bots* : activer **Bot Fight Mode**.
   - *Security → WAF → Custom rules* : règle **Skip** (bots/WAF managé) pour
     `URI Path starts with "/api/cron/"` **OR** `URI Path equals "/api/stripe/webhook"`
     — ces routes sont appelées par GitHub Actions et Stripe et sont déjà authentifiées
     (OIDC / re-fetch Stripe). Sans cette exception, Bot Fight Mode peut les bloquer.
   - *Security → WAF → Rate limiting rules* (1 règle incluse en Free) :
     `URI Path starts with "/api/ai/"` → **30 requêtes / 10 s par IP** → *Block 10 s*.
     (Le quota applicatif par utilisateur/plan reste la vraie limite ; celle-ci stoppe les scripts.)
7. **Vercel** → *Settings → Domains* : rien à changer, les domaines restent vérifiés
   (Vercel détecte le proxy et bascule sur un certificat via *challenge HTTP*).
8. Vérifier : `curl -sI https://www.pingenx.io | grep -i "server\|cf-ray"` doit afficher
   `server: cloudflare` et un `cf-ray`. Tester ensuite une connexion, une génération IA,
   et un paiement test Stripe.

### 2.3 Ce que Cloudflare n'apporte **pas**

- Il ne remplace pas le plan Vercel **Pro** : le plan Hobby interdit l'usage commercial, c'est
  une question de conditions d'utilisation, pas de trafic.
- Le cache ne s'applique pas aux appels `/api/*` ; l'économie vient des bundles/images et de
  l'absorption des bots, pas des fonctions.

---

## 3. Offre v2 : grille pensée pour borner les dépenses

### 3.1 Coûts fixes mensuels (après souscription)

| Poste | Montant |
| --- | --- |
| Vercel Pro (1 siège) | 20 $ |
| Supabase Pro | 25 $ |
| Cloudflare Free, Sentry Free, PostHog Free (≤ 1 M événements) | 0 $ |
| Domaine (annualisé) | ≈ 1 $ |
| **Total fixe** | **≈ 46 $ ≈ 42 €** |

### 3.2 Coûts variables (ce que l'offre doit encadrer)

| Ressource | Coût unitaire estimé | Où c'est plafonné |
| --- | --- | --- |
| Image IA (xAI `grok-imagine-image-quality`) | ≈ 0,07 $ | quota jour + mois par plan, **plafond global 400/jour** |
| Texte IA (Gemini 2.5 Flash via OpenRouter, ~1,5 k tokens) | ≈ 0,002 $ | quota jour + mois par plan, plafond global 3 000/jour |
| Publication Pinterest | 0 $ (API) mais 1 invocation Vercel | quota jour + mois |
| Stockage images (Supabase Storage) | 0,021 $/Go | 1 image ≈ 300 Ko → 300 Pins ≈ 90 Mo/utilisateur |

Le poste à surveiller est **l'image IA** : c'est le seul qui peut déraper. D'où un plafond
global en base (`app_limits.ai_image = 400/jour`, ≈ 28 $/jour au pire, modifiable sans
déploiement) en plus des quotas individuels. Quand il est atteint, l'API répond `503 AI_CAPACITY`
et l'interface affiche « service IA saturé, réessayez plus tard » au lieu de facturer.

### 3.3 Grille (`supabase/migrations/20261010_pricing_v2.sql`)

| | **Starter** (0 €) | **Pro** (19 €) | **Business** (49 €) |
| --- | --- | --- | --- |
| Pins / mois | 5 | 100 | 300 |
| Images IA / mois | 5 | 100 | 300 |
| Textes IA / mois | 20 | 300 | 1 000 |
| Images IA / jour (anti-rafale) | 3 | 15 | 40 |
| Textes IA / jour | 10 | 60 | 150 |
| Publications / jour | 30 | 120 | 300 |
| Autopilote | — | jusqu'à 3 Pins / jour | jusqu'à 5 Pins / jour |
| Comptes Pinterest | 1 | 1 | 1 |
| Support | standard | prioritaire | dédié |

**Coût variable maximal par utilisateur** (s'il consomme 100 % de ses quotas) :

| Plan | Images | Textes | Total max | Marge minimale |
| --- | --- | --- | --- | --- |
| Starter | 5 × 0,07 = 0,35 $ | 20 × 0,002 = 0,04 $ | **≈ 0,40 $** | − 0,40 $ (coût d'acquisition assumé) |
| Pro | 100 × 0,07 = 7 $ | 300 × 0,002 = 0,6 $ | **≈ 7,6 $** | ≈ 12,7 € / 19 € (**67 %**) |
| Business | 300 × 0,07 = 21 $ | 1 000 × 0,002 = 2 $ | **≈ 23 $** | ≈ 28 € / 49 € (**57 %**) |

En pratique l'usage moyen est de 30–50 % des quotas, ce qui porte les marges réelles vers 80–85 %.

**Seuil de rentabilité** : 42 € de fixe ≈ **4 abonnés Pro** (ou 2 Business). Au-delà,
chaque Pro rapporte au moins 12 € nets même en usage maximal.

**Scénario 100 utilisateurs** (85 Starter, 12 Pro, 3 Business) :

- revenus : 12 × 19 + 3 × 49 = **375 €/mois** ;
- coût variable max : 85 × 0,40 + 12 × 7,6 + 3 × 23 ≈ **195 $ ≈ 180 €** (réel attendu ≈ 70 €) ;
- fixe : 42 € → **résultat compris entre +150 € (pire cas) et +260 € (usage moyen)**.

### 3.4 Ce qui a changé par rapport à l'ancienne grille

| Avant | Après | Pourquoi |
| --- | --- | --- |
| Starter 10 Pins/mois, quotas IA journaliers seulement | 5 Pins, 5 images, 20 textes **par mois** + plafonds journaliers | un compte gratuit pouvait coûter 0,21 $ **par jour** (6 $/mois) sans plafond mensuel |
| Business « Pins illimités » | 300 Pins / 300 images | « illimité » rend le coût non borné ; 300 couvre déjà 10 Pins/jour |
| « 3 / 10 comptes Pinterest », « API d'automatisation », « collaboration d'équipe » | retirés | fonctionnalités inexistantes → risque juridique (pratique commerciale trompeuse) |
| Autopilote accessible à tous | Pro et Business uniquement, 3 ou 5 Pins/jour | l'autopilote consomme une image IA par Pin, sans intervention humaine : c'est le poste le plus coûteux |
| Essai 14 jours annoncé | retiré (le Starter gratuit joue ce rôle) | aucun essai n'existe dans Stripe |

Tous les plafonds vivent en base (`plan_pin_limit`, `plan_daily_quota`, `plan_monthly_quota`,
`plan_autopilot_daily`, `app_limits`) : ajuster une valeur ne nécessite qu'une requête SQL,
l'interface lit les limites via `my_quota_usage()`.

### 3.5 Points de vigilance après la mise en place

- Surveiller dans PostHog le ratio `quota_hit` → `checkout_started` : si beaucoup de Starter
  tapent le quota sans convertir, passer Starter à 3 images plutôt que d'augmenter.
- Surveiller la facture xAI : si le coût réel par image diffère de 0,07 $, recalculer les
  plafonds (`UPDATE public.app_limits SET daily_cap = … WHERE kind = 'ai_image'`).
- Supabase Pro inclut 100 Go de stockage : à 300 Pins/Business, ~1 000 utilisateurs tiennent.
  Prévoir une purge des images des Pins publiés depuis > 90 jours si nécessaire.

---

## 4. Variables d'environnement ajoutées

| Variable | Où | Obligatoire | Rôle |
| --- | --- | --- | --- |
| `SENTRY_DSN` | Vercel (server) | non | erreurs des fonctions `api/*` |
| `VITE_SENTRY_DSN` | Vercel (public) | non | erreurs navigateur |
| `VITE_POSTHOG_KEY` | Vercel (public) | non | analytics produit |
| `VITE_POSTHOG_HOST` | Vercel (public) | non | défaut `https://eu.i.posthog.com` |

`VITE_VERCEL_GIT_COMMIT_SHA` et `VITE_VERCEL_ENV` sont injectées automatiquement par Vercel
lorsque l'option *Automatically expose System Environment Variables* est active
(Settings → Environment Variables) ; elles servent de `release`/`environment` dans Sentry.
