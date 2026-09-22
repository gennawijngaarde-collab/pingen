# 🎨 Configuration Grok Image (xAI)

## Obtenir une clé API Grok

1. **Créer un compte xAI** : https://x.ai/api
2. **Générer une clé API**
3. **Copier la clé** (elle commence par `xai-...`)

---

## Configuration en Local (Développement)

### 1. Ajouter la clé dans `.env`

```env
# Grok Image (xAI - génération d'images)
GROK_API_KEY=xai-votre-cle-ici
```

OU

```env
XAI_API_KEY=xai-votre-cle-ici
```

### 2. Redémarrer le serveur

```bash
npm run dev
```

---

## Configuration sur Vercel (Production)

### 1. Aller dans les paramètres Vercel

1. Ouvrir votre projet sur [vercel.com](https://vercel.com)
2. Aller dans **Settings** → **Environment Variables**

### 2. Ajouter la variable

**Name**: `GROK_API_KEY` (ou `XAI_API_KEY`)  
**Value**: `xai-votre-cle-ici`  
**Environments**: ✅ Production, ✅ Preview, ✅ Development

### 3. Redéployer

Cliquez sur **Save** puis déclenchez un nouveau déploiement.

---

## Vérification

### En local

1. Allez sur http://localhost:5173/dashboard/pins/generate
2. Essayez de générer un Pin
3. L'image devrait être générée par Grok

### En production

1. Allez sur https://www.pingenx.io/dashboard/pins/generate
2. Essayez de générer un Pin
3. L'image devrait être générée par Grok

---

## Caractéristiques Grok Image

- **Modèle** : grok-2-vision-1212
- **Ratio** : 1024x1536 (2:3, parfait pour Pinterest)
- **Qualité** : HD
- **Vitesse** : Rapide (~5-10 secondes)
- **Coût** : Selon votre plan xAI

---

## Comparaison avec Ideogram

| Caractéristique | Grok (xAI) | Ideogram |
|-----------------|------------|----------|
| Vitesse | ⚡ Rapide | 🐢 Lent |
| Qualité | ✅ Excellente | ✅ Excellente |
| Texte sur image | ✅ Bon | ✅ Excellent |
| Coût | Variable | Variable |
| API | Simple REST | FormData |

---

## Dépannage

### "GROK_API_KEY absente"

→ Vérifiez que la variable est bien définie dans `.env` ou Vercel

### "Invalid API key"

→ Vérifiez que votre clé commence bien par `xai-`

### "Rate limit exceeded"

→ Vous avez atteint la limite de requêtes. Attendez ou upgradez votre plan xAI.

### Images de mauvaise qualité

→ Améliorez votre prompt en étant plus spécifique sur le contenu souhaité.

---

## Support

Pour toute question sur l'API Grok :
- Documentation : https://x.ai/api
- Support xAI : support@x.ai

Pour les questions sur GenX :
- Email : support@pingenx.io
