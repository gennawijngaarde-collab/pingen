# PinGen - Guide des Fonctionnalités d'Automatisation

Ce document détaille toutes les fonctionnalités d'automatisation mises en place dans PinGen.

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

# Ideogram (optionnel - images de Pins)
IDEOGRAM_API_KEY=your-ideogram-key

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
