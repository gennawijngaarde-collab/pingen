# GenX — Publication automatique des pins planifiés (Autopilote)

## Architecture

Un seul endpoint serveur fait tout le travail : `api/cron/publish-scheduled-pins.ts`.
Il s'appuie sur `server/publishScheduledPins.ts`, du code Node pur (aucune dépendance
au code frontend `src/`, qui utilise `import.meta.env` et `window`).

Pour chaque pin `status = 'scheduled'` dont `scheduled_at <= now()` :

1. Récupère le compte Pinterest actif de l'utilisateur (`pinterest_accounts` par `user_id`).
2. Rafraîchit le token Pinterest s'il est expiré (`refresh_token` + `PINTEREST_APP_SECRET`).
3. Résout le board (pin → boards en cache du compte → premier board via l'API Pinterest).
4. `POST https://api.pinterest.com/v5/pins` avec `media_source.image_url`.
5. Met à jour le pin : `published` + `pinterest_pin_id`, ou retry dans 15 min (3 essais max) puis `failed` avec `error_message`.

### Deux modes d'appel

| Appelant | Authentification | Portée |
|---|---|---|
| Automatisation (GitHub Actions / Vercel Cron) | `Authorization: Bearer <CRON_SECRET>` ou header `x-vercel-cron` | Tous les utilisateurs (client Supabase **service role**) |
| Utilisateur connecté (bouton dans l'app / AutoPublisher) | `Authorization: Bearer <JWT Supabase>` | Ses propres pins uniquement (RLS) |

En mode utilisateur, le corps JSON permet de publier **par avance** :
`{ "pinId": "<uuid>" }` (ou `pinIds: []`) publie ce pin immédiatement quelle que soit sa date ;
`{ "scope": "all" }` publie tous les pins programmés, y compris futurs. Sans corps : pins en retard uniquement.
Le helper frontend est `src/lib/publish.ts` (`publishPinsNow`), utilisé par le bouton « Publier » de chaque
pin, « Tout publier maintenant », l'AutoPublisher et `usePins().publishPin`.

### Couches de déclenchement

1. **GitHub Actions** — `.github/workflows/auto-publish.yml`, cron `*/5 * * * *`. Fonctionne 24/7 sans que l'app soit ouverte.
2. **Vercel Cron** — `vercel.json`, 1 fois/jour à 06:00 UTC (limite du plan Hobby : un cron quotidien maximum, sinon Vercel **refuse le déploiement**).
3. **AutoPublisher** (`src/components/dashboard/AutoPublisher.tsx`) — dès que la page Planification est ouverte, publie automatiquement les pins en retard de l'utilisateur, et affiche l'état / les erreurs.
4. Boutons manuels « Tout publier maintenant » et « Publier maintenant » par pin.

## Variables d'environnement Vercel

| Variable | Rôle | Statut |
|---|---|---|
| `CRON_SECRET` | Authentifie GitHub Actions | Configurée |
| `SUPABASE_SERVICE_ROLE_KEY` | **Requise pour les couches 1 et 2** (lecture des pins de tous les utilisateurs malgré RLS) | À ajouter : Supabase → Project Settings → API → `service_role` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Utilisées en fallback par le serveur | Configurées |
| `PINTEREST_APP_SECRET` | Rafraîchissement des tokens Pinterest | Configurée |

Sans `SUPABASE_SERVICE_ROLE_KEY`, l'endpoint appelé en mode cron répond `503` avec un message explicite ;
les couches 3 et 4 (mode utilisateur) fonctionnent quand même.

## Prérequis Pinterest : accès « Standard »

Une app Pinterest en accès **Trial** reçoit `403 Apps with Trial access may not create Pins in production`.
Le moteur détecte ce cas : les pins concernés **restent `scheduled`** (pas de retry consommé), avec
`error_message` explicite, re-tentés toutes les heures, et partent automatiquement dès que Pinterest
accorde l'accès Standard. Demande : https://developers.pinterest.com/apps/ → app 1609578 → « Request Standard access ».

## Contraintes plan Vercel Hobby

- **12 fonctions serverless max** par déploiement — le dossier `api/` en compte exactement 12. Toute nouvelle route doit être fusionnée dans une existante.
- **1 cron/jour max** dans `vercel.json`.

## Vérifier que ça marche

- Runs GitHub Actions : https://github.com/gennawijngaarde-collab/pingen/actions (workflow « Auto-Publish Scheduled Pins »)
- Test manuel :

```bash
curl -X POST https://www.pingenx.io/api/cron/publish-scheduled-pins \
  -H "Authorization: Bearer $CRON_SECRET"
```

Réponse attendue : `{"success":true,"mode":"cron","processed":N,"successful":N,"failed":0,"details":[...]}`.
