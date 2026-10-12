# PinGen - Guide des Fonctionnalités d'Automatisation

Ce document détaille toutes les fonctionnalités d'automatisation mises en place dans PinGen.

---

## ⚙️ Où tourne l'automatisation (état actuel — 2026-10)

**Tout se passe côté serveur, sans navigateur ouvert.** Le tableau de bord n'est qu'une
vue : fermer l'onglet ne change rien à la publication ni à la génération.

| Tâche | Déclencheur | Code |
| --- | --- | --- |
| Publier les pins dont l'heure est passée | **Supabase pg_cron** toutes les 5 min (`:00, :05, …`, `supabase/migrations/20261012_pg_cron_trigger.sql`) ; secours : GitHub Actions (`.github/workflows/auto-publish.yml`, OIDC, en pratique quelques fois par jour) et Vercel Cron quotidien 06:00 UTC | `api/cron/publish-scheduled-pins.ts` → `server/publishScheduledPins.ts` |
| Générer les pins de l'autopilote (texte + image IA, planification aux heures choisies) | pg_cron toutes les 5 min décalé (`:02, :07, …`) avec `?task=autopilot` ; secours : 2ᵉ étape du workflow GitHub | `server/autopilot.ts` |
| Entretien (webhook Stripe, réconciliation abonnements) | à la suite de la publication | `server/maintenance.ts` |

Pourquoi pg_cron : GitHub Actions `schedule: */5` n'a tourné en réalité qu'une fois toutes les 3 à 7 h
(observé sur 10 jours de runs), et Vercel Hobby n'autorise qu'un cron par jour. pg_cron + pg_net
appellent l'API depuis la base elle-même, à la minute près, sans coût. Le jeton (`CRON_SECRET`
côté Vercel) est lu dans Supabase Vault (`genx_cron_secret`) à chaque exécution. Suivi :
`select * from cron.job_run_details order by start_time desc` et `select * from net._http_response order by created desc`.

Fonctionnement de l'autopilote serveur :

1. `autopilot_accounts()` liste les comptes dont l'autopilote est **activé** et dont le plan l'autorise (Pro / Business).
2. Pour chaque compte, les créneaux manquants sont calculés dans **son fuseau horaire** (`settings.timezone`, enregistré par le navigateur lors de la sauvegarde ; repli `Europe/Paris`).
3. Les comptes sont traités par urgence (créneau le plus proche d'abord), **un pin par compte et par passage** ; le passage s'arrête avant d'épuiser les 60 s de la fonction. Avec un passage toutes les 5 min, la capacité est largement suffisante (≈ 500 pins/jour).
4. Un **bail** (`claim_autopilot_lease`) empêche deux passages simultanés de générer le même créneau.
5. Les quotas (`consume_quota_for`) et les garde-fous de plan (trigger `pins_block_disabled_autopilot`) s'appliquent exactement comme pour une génération manuelle. Désactiver l'autopilote arrête la génération au passage suivant, et un pin en cours de génération est abandonné si l'interrupteur a été coupé entre-temps.
6. Les statistiques (`lastGeneratedAt`, `totalGenerated`) sont écrites dans `user_metadata.autopilot` via l'API admin.

Différence avec la génération manuelle (« Générer maintenant » dans le navigateur) : l'image serveur
ne reçoit pas le texte d'accroche superposé (pas de canvas côté serveur) ; l'accroche vit dans le titre.

Les sections ci-dessous décrivent l'historique des workers navigateur ; `SchedulerWorker` ne fait plus
qu'appeler le moteur serveur pour l'utilisateur connecté, et `AutopilotWorker` a été supprimé.

---

## ✅ Fonctionnalités d'Automatisation Implémentées

### 1. 🔄 Scheduler Worker (Publication Automatique)

**Fichier**: `src/components/dashboard/SchedulerWorker.tsx`

Le Scheduler Worker tourne en arrière-plan et vérifie automatiquement les Pins planifiés à publier.

**Fonctionnement**:
- Vérifie toutes les minutes si des Pins sont à publier
- Se déclenche aussi quand l'utilisateur revient sur l'onglet
- Affiche des notifications de succès/échec

**Logique de publication** (`src/lib/scheduler.ts`):
```typescript
// Récupère tous les Pins planifiés dont la date est dépassée
const scheduledPins = await supabase
  .from('pins')
  .select('*')
  .eq('status', 'scheduled')
  .lte('scheduled_at', now);

// Publie chaque Pin sur Pinterest
for (const pin of scheduledPins) {
  await publishScheduledPin(pin);
}
```

### 2. 📅 Planification en Masse (Bulk Scheduler)

**Fichier**: `src/components/dashboard/BulkScheduler.tsx`

Permet de planifier plusieurs Pins d'un coup.

**Modes disponibles**:

#### Mode Manuel
- Définissez une date de début
- Choisissez l'intervalle (30min, 1h, 2h, 4h, 8h, 24h)
- Les Pins sont espacés régulièrement

#### Mode Automatique (Smart Schedule)
- Planification aux meilleurs horaires automatiquement
- Horaires optimaux : 8h, 12h, 15h, 18h, 21h
- Définissez le nombre de posts par jour (1-5)
- Répartition intelligente sur plusieurs jours

**Utilisation**:
1. Sélectionnez des Pins en brouillon (checkbox)
2. Cliquez sur "Planification en masse"
3. Choisissez le mode et les options
4. Les Pins sont planifiés automatiquement

### 3. 🔄 Système de Retry (Gestion des Échecs)

**Logique de retry**:
- Maximum 3 tentatives par Pin
- Attente de 15 minutes entre chaque retry
- Statut passe à "failed" après 3 échecs
- Message d'erreur stocké pour diagnostic

```typescript
const MAX_RETRIES = 3;

if (retryCount >= MAX_RETRIES) {
  await supabase
    .from('pins')
    .update({
      status: 'failed',
      error_message: error.message,
    })
    .eq('id', pin.id);
} else {
  // Retry dans 15 minutes
  const retryAt = new Date(Date.now() + 15 * 60 * 1000);
  await supabase
    .from('pins')
    .update({ scheduled_at: retryAt })
    .eq('id', pin.id);
}
```

### 4. 📊 Statistiques de Publication

**Fonction**: `getPublishingStats(userId)`

Retourne :
- Nombre total de Pins planifiés
- Nombre total de Pins publiés
- Nombre total d'échecs
- Nombre de Pins à publier aujourd'hui

### 5. 🎨 Génération IA de Contenu

**Fichier**: `src/lib/ai.ts`

Génère automatiquement :
- **Titres** : Accrocheurs, optimisés pour Pinterest (max 100 caractères)
- **Descriptions** : SEO-friendly avec CTA (2-3 phrases)
- **Hashtags** : 3-5 hashtags pertinents (mix populaires + niche)
- **Alt Text** : Pour l'accessibilité et le SEO

**Options**:
- Niche (Décoration, Mode, Cuisine, etc.)
- Ton (Professionnel, Décontracté, Inspirant, Éducatif, Humoristique)

### 6. 📅 Interface de Planification Complète

**Fichier**: `src/pages/dashboard/Schedule.tsx`

**Fonctionnalités**:
- Calendrier visuel
- 3 onglets : Planifiés / Brouillons / Publiés
- Sélection multiple (checkbox)
- Actions rapides (éditer, replanifier, annuler, supprimer)
- Indicateurs de statut colorés
- Messages d'erreur visibles

### 7. 🔌 Intégration API Pinterest

**Fichier**: `src/lib/pinterest.ts`

**Fonctions disponibles**:
- `getPinterestAuthUrl()` - Génère l'URL OAuth
- `exchangeCodeForToken()` - Échange le code contre un token
- `getPinterestUser()` - Récupère les infos utilisateur
- `getPinterestBoards()` - Liste les tableaux
- `createPinterestBoard()` - Crée un tableau
- `createPinterestPin()` - Publie un Pin
- `getPinAnalytics()` - Récupère les analytics
- `refreshPinterestToken()` - Rafraîchit le token

**Mode Demo** : Fonctionne sans credentials Pinterest (mock data)

---

## 📋 Schéma de Base de Données (Supabase)

### Table `pins`

```sql
CREATE TABLE pins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  board_id TEXT,
  board_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,      -- Date de planification
  published_at TIMESTAMP WITH TIME ZONE,      -- Date de publication
  pinterest_pin_id TEXT,                      -- ID du Pin sur Pinterest
  hashtags TEXT[] DEFAULT '{}',
  alt_text TEXT,
  retry_count INTEGER DEFAULT 0,              -- Nombre de tentatives
  error_message TEXT,                         -- Message d'erreur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table `pinterest_accounts`

```sql
CREATE TABLE pinterest_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pinterest_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  profile_image TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  boards JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Flux d'Automatisation Complet

### 1. Création d'un Pin

```
Utilisateur → Générateur IA → Sauvegarde Brouillon
                    ↓
            [Titre, Description, Hashtags]
```

### 2. Planification

```
Brouillon → Sélection Date/Heure → Status: scheduled
                ↓
        scheduled_at = date choisie
```

### 3. Publication Automatique

```
Scheduler Worker (toutes les minutes)
         ↓
Vérifie pins.scheduled_at <= NOW()
         ↓
    Pour chaque Pin:
         ↓
    Récupère access_token
         ↓
    Appel API Pinterest → createPin()
         ↓
    Succès: status = published
         ↓
    Échec: retry_count++ (max 3)
```

### 4. Planification en Masse

```
Sélection multiple Pins
         ↓
    Mode Manuel:
         ↓
    Date début + Intervalle
         ↓
    Pin 1: date début
    Pin 2: date début + intervalle
    Pin 3: date début + 2×intervalle
         ↓
    Tous status = scheduled
```

### 5. Planification Auto (Smart)

```
Sélection multiple Pins
         ↓
    Mode Auto + Posts/jour
         ↓
    Horaires optimaux: [8h, 12h, 15h, 18h, 21h]
         ↓
    Répartition intelligente
         ↓
    Jour 1: 8h, 12h, 15h
    Jour 2: 18h, 21h, 8h
    Jour 3: 12h, 15h, 18h
```

---

## ⚙️ Configuration Requise

### Variables d'Environnement

```env
# Supabase (Requis)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# OpenRouter (optionnel - IA texte/vision)
OPENROUTER_API_KEY=sk-or-v1-your-key

# Grok Image (xAI - optionnel - images de Pins)
GROK_API_KEY=your-grok-key

# Pinterest API (Optionnel - pour publication réelle)
VITE_PINTEREST_APP_ID=your-app-id
VITE_PINTEREST_APP_SECRET=your-secret
```

### Sans Configuration

L'application fonctionne **entièrement en mode démo** sans aucune configuration :
- Mock data pour les Pins
- Génération IA avec templates prédéfinis
- Publication simulée (pas de vrai Pinterest)

---

## 📈 Limites et Quotas

| Plan | Pins/mois | Comptes Pinterest | Planification |
|------|-----------|-------------------|---------------|
| Starter | 10 | 1 | Manuelle |
| Pro | 100 | 3 | Manuelle + Auto |
| Business | Illimité | 10 | Manuelle + Auto + API |

---

## 🔮 Améliorations Futures

- [ ] **Webhooks Pinterest** : Recevoir notifications en temps réel
- [ ] **File d'attente Redis** : Pour plus de fiabilité
- [ ] **Analytics avancés** : Prédiction des meilleurs horaires
- [ ] **A/B Testing** : Tester différents contenus
- [ ] **Recyclage de contenu** : Republier les meilleurs Pins
- [ ] **Intégration RSS** : Auto-générer depuis un blog
- [ ] **Templates dynamiques** : Créer des templates personnalisés

---

## 🐛 Dépannage

### Les Pins ne se publient pas automatiquement

1. Vérifiez que le SchedulerWorker est actif (visible dans les logs)
2. Vérifiez que les Pins ont `status = 'scheduled'`
3. Vérifiez que `scheduled_at` est dans le passé
4. Vérifiez les erreurs dans la console

### Erreur "No Pinterest account connected"

1. Connectez un compte Pinterest dans Paramètres
2. Vérifiez que le token n'est pas expiré

### Rate Limiting Pinterest

- Maximum 1000 Pins/jour
- Implémentez un délai entre les publications
- Utilisez la planification espacée

---

## 📚 Ressources

- [Pinterest API Docs](https://developers.pinterest.com/docs/api/v5/)
- [Supabase Docs](https://supabase.com/docs)
- [OpenRouter](https://openrouter.ai) (texte/vision)
- [Ideogram](https://developer.ideogram.ai) (images)
