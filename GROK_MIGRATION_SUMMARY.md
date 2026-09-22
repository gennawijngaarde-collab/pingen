# ✅ Changement d'API : Ideogram → Grok Image

## 🎯 Résumé

L'application GenX utilise maintenant **Grok Image (xAI)** au lieu d'Ideogram pour la génération d'images.

---

## 📦 Changements effectués

### 1. API Backend (`api/ai/image.ts`)
- ✅ Remplacé l'endpoint Ideogram par Grok Image
- ✅ Maintien de la sécurité (authentification JWT Supabase)
- ✅ Format d'image : 1024x1536 (ratio 2:3 pour Pinterest)
- ✅ Modèle : `grok-2-vision-1212`

### 2. Variables d'environnement
**Ancienne variable** : `IDEOGRAM_API_KEY`  
**Nouvelle variable** : `GROK_API_KEY` ou `XAI_API_KEY`

**Fichiers modifiés** :
- `.env.example`
- `vite.ai-plugin.ts` (dev local)
- `api/ai/status.ts` (vérification)
- `src/lib/ai.ts` (client-side)
- `src/hooks/useAiStatus.ts`
- `src/vite-env.d.ts` (types TypeScript)

### 3. Documentation
✅ **Nouveau guide** : `GROK_IMAGE_SETUP.md`  
✅ Mis à jour : `README.md`, `AI-GENERATION.md`, `AUTOMATION.md`

### 4. Build & Tests
✅ Build réussi sans erreurs  
✅ Types TypeScript validés  
✅ Commit & Push sur `main`

---

## 🚀 Prochaines étapes (pour toi)

### 1. Obtenir une clé API Grok
1. Va sur https://x.ai/api
2. Crée un compte (ou connecte-toi)
3. Génère une clé API (commence par `xai-...`)

### 2. Configurer Vercel
1. Ouvre ton projet sur [vercel.com](https://vercel.com)
2. Va dans **Settings** → **Environment Variables**
3. Ajoute :
   - **Name** : `GROK_API_KEY`
   - **Value** : `xai-ta-cle-ici`
   - **Environments** : ✅ Production, ✅ Preview, ✅ Development
4. Clique sur **Save**
5. Redéploie l'application

### 3. Tester
- **Local** (dev) : Ajoute `GROK_API_KEY=xai-...` dans ton fichier `.env` local
- **Production** : Teste sur https://www.pingenx.io/dashboard/pins/generate

---

## 📊 Comparaison

| Caractéristique | Grok (xAI) | Ideogram |
|-----------------|------------|----------|
| Vitesse | ⚡ Rapide (~5-10s) | 🐢 Lent (~15-30s) |
| API | REST simple | FormData complexe |
| Qualité | ✅ Excellente | ✅ Excellente |
| Texte sur image | ✅ Bon | ✅ Excellent |
| Fallback | Non (API unique) | Oui (v3 + v2) |

---

## 📖 Documentation complète

Consulte `GROK_IMAGE_SETUP.md` pour :
- Instructions détaillées
- Dépannage
- Exemples de configuration

---

## ✅ Validation

- [x] Code modifié
- [x] Build réussi
- [x] Types TypeScript OK
- [x] Documentation à jour
- [x] Commit & Push effectués
- [ ] Clé API Grok configurée sur Vercel (À FAIRE)
- [ ] Test en production (À FAIRE)

---

## 🆘 Besoin d'aide ?

Si tu rencontres des problèmes :
1. Vérifie que la clé commence bien par `xai-`
2. Vérifie que la variable est bien `GROK_API_KEY` (pas `XAI_API_KEY`)
3. Redéploie après avoir ajouté la variable
4. Consulte les logs Vercel en cas d'erreur

---

**Date** : 22 septembre 2026  
**Commit** : `be085b4` - feat: replace Ideogram API with Grok Image (xAI)
