# 🔒 Audit de Sécurité - GenX

**Date**: 22 septembre 2026  
**Statut**: ⚠️ **VULNÉRABILITÉS CRITIQUES TROUVÉES**

---

## ✅ POINTS FORTS

### 1. Row Level Security (RLS) ✅
**Statut**: EXCELLENT

Toutes les tables ont RLS activé avec des politiques correctes :

```sql
-- Exemple: profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

✅ **Tables protégées** :
- `profiles` - ✅ Utilisateurs ne voient que leur profil
- `pins` - ✅ Utilisateurs ne voient que leurs pins
- `pinterest_accounts` - ✅ Utilisateurs ne voient que leurs comptes
- `subscriptions` - ✅ Utilisateurs ne voient que leur abonnement
- `pin_analytics` - ✅ Utilisateurs ne voient que leurs analytics

### 2. Client-Side Security ✅
**Statut**: BON

- `useAuth` hook gère correctement les sessions
- `usePins` hook vérifie `user.id` avant les requêtes
- `Settings.tsx` utilise `user.id` pour les updates
- Composants protégés nécessitent authentification

---

## ❌ VULNÉRABILITÉS CRITIQUES

### 1. 🚨 API AI CHAT Non Protégée
**Fichier**: `api/ai/chat.ts`  
**Sévérité**: CRITIQUE 🔴

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  // ❌ AUCUNE VÉRIFICATION D'AUTHENTIFICATION !
  
  // N'importe qui peut appeler cet endpoint
  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    // ...
  });
}
```

**Risques** :
- ❌ N'importe qui peut consommer vos crédits OpenRouter
- ❌ Pas de limite de requêtes
- ❌ Coût illimité pour vous

**Impact financier** : Potentiellement ÉLEVÉ

---

### 2. 🚨 API AI IMAGE Non Protégée
**Fichier**: `api/ai/image.ts`  
**Sévérité**: CRITIQUE 🔴

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    // ...
  }

  const apiKey = process.env.IDEOGRAM_API_KEY;
  // ❌ AUCUNE VÉRIFICATION D'AUTHENTIFICATION !
  
  // N'importe qui peut générer des images
  const v3Res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    // ...
  });
}
```

**Risques** :
- ❌ N'importe qui peut consommer vos crédits Ideogram
- ❌ Génération d'images illimitée
- ❌ Coût illimité pour vous

**Impact financier** : Potentiellement TRÈS ÉLEVÉ

---

### 3. ⚠️ Validation Partielle dans Updates/Deletes
**Fichiers**: `src/hooks/usePins.tsx`, `src/lib/supabase.ts`  
**Sévérité**: MOYENNE 🟡

```typescript
// usePins.tsx - updatePin
const updatePin = useCallback(async (pinId: string, updates: Partial<Pin>) => {
  const { data, error: supabaseError } = await supabase
    .from('pins')
    .update(updates)
    .eq('id', pinId)  // ⚠️ Seul pinId est vérifié
    // Manque: .eq('user_id', user.id) pour defense-in-depth
    .select()
    .single();
}, []);
```

**Risques** :
- ⚠️ Dépend uniquement de RLS (defense-in-depth manquante)
- ⚠️ Si RLS est désactivé par erreur, vulnérabilité

**Impact** : Faible (car RLS est actif) mais pas idéal

---

## 🔧 CORRECTIONS REQUISES

### PRIORITÉ 1 (URGENT) 🚨

#### 1. Protéger `/api/ai/chat.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  // ✅ AJOUTER: Vérification d'authentification
  const authHeader = req.headers?.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Non authentifié' } });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    res.status(401).json({ error: { message: 'Token invalide' } });
    return;
  }

  // ✅ AJOUTER: Vérifier les limites du plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, pins_created_this_month')
    .eq('id', user.id)
    .single();

  // Limiter les requêtes selon le plan
  // ...

  const apiKey = process.env.OPENROUTER_API_KEY;
  // ... reste du code
}
```

#### 2. Protéger `/api/ai/image.ts`

Appliquer la même protection d'authentification.

---

### PRIORITÉ 2 (RECOMMANDÉ) ⚠️

#### 3. Ajouter defense-in-depth aux updates/deletes

```typescript
// usePins.tsx
const updatePin = useCallback(async (pinId: string, updates: Partial<Pin>) => {
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('pins')
    .update(updates)
    .eq('id', pinId)
    .eq('user_id', user.id)  // ✅ AJOUTER cette ligne
    .select()
    .single();
    
  // ...
}, [user]);

const deletePin = useCallback(async (pinId: string) => {
  if (!user) return;
  
  const { error } = await supabase
    .from('pins')
    .delete()
    .eq('id', pinId)
    .eq('user_id', user.id)  // ✅ AJOUTER cette ligne
    
  // ...
}, [user]);
```

---

## 📊 RÉSUMÉ

| Élément | Statut | Priorité |
|---------|--------|----------|
| RLS activé sur toutes les tables | ✅ EXCELLENT | - |
| Politiques RLS correctes | ✅ EXCELLENT | - |
| Client-side authentication | ✅ BON | - |
| API AI Chat | ❌ VULNÉRABLE | 🚨 URGENT |
| API AI Image | ❌ VULNÉRABLE | 🚨 URGENT |
| Defense-in-depth | ⚠️ PARTIEL | ⚠️ Recommandé |

---

## ✅ CHECKLIST DE CONFORMITÉ

### Bonnes Pratiques Supabase

- [x] RLS activé sur toutes les tables
- [x] Politiques utilisant `auth.uid()`
- [x] Index sur `user_id` pour performance
- [x] Trigger pour création auto de profil
- [x] Client-side utilise session Supabase
- [ ] **API routes protégées par auth** ⚠️
- [x] Queries filtrent par `user_id`
- [x] Updates vérifient ownership (via RLS)

### Sécurité Générale

- [x] Utilisateurs voient leurs propres données uniquement ✅
- [x] Utilisateurs modifient leur propre profil uniquement ✅
- [x] Protection contre accès non autorisés (RLS) ✅
- [ ] **API endpoints publics protégés** ❌

---

## 🎯 PLAN D'ACTION

1. **IMMÉDIAT** : Protéger `/api/ai/chat.ts` et `/api/ai/image.ts`
2. **CETTE SEMAINE** : Ajouter defense-in-depth aux updates/deletes
3. **AUDIT** : Vérifier tous les autres endpoints API
4. **MONITORING** : Ajouter logging des accès API

---

## 📝 NOTES

- **RLS est votre première ligne de défense** : ✅ Excellent
- **API routes sont exposées** : ❌ Problématique
- **Correction estimée** : 2-3 heures de développement

**Recommandation** : Corriger les vulnérabilités API AVANT de lancer en production.
