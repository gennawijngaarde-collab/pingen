# 🤖 Configuration automatique de Stripe Live

## ⚡ En 2 commandes !

### 1️⃣ Récupérer votre clé Stripe (1 min)

```bash
# Aller sur https://dashboard.stripe.com/apikeys
# Basculer en mode Live (toggle en haut à droite)
# Copier la clé secrète : sk_live_...
```

### 2️⃣ Exécuter le script (30 secondes)

```bash
STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe
```

**C'est tout ! ✅**

---

## 📊 Ce que fait le script

Le script va **automatiquement** :

1. ✅ Créer le produit **GenX Pro** (19€/mois, essai 7j)
2. ✅ Créer le produit **GenX Business** (49€/mois, essai 7j)
3. ✅ Configurer le webhook Stripe
4. ✅ Générer les variables pour Vercel
5. ✅ Sauvegarder dans `.env.stripe`

**Temps total : 30 secondes** ⏱️

---

## 📋 Résultat

```bash
🎉 Configuration terminée avec succès !

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COPIEZ CES VARIABLES DANS VERCEL (Environment Variables)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Stripe Price IDs (créés par ce script)
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_BUSINESS=price_yyy

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Variables sauvegardées dans .env.stripe
```

---

## 🔧 Configurer Vercel (2 min)

### Option A : Copier-coller depuis .env.stripe

```bash
# 1. Ouvrir le fichier généré
cat .env.stripe

# 2. Copier toutes les variables

# 3. Aller sur Vercel
https://vercel.com/dashboard
→ Projet pingen
→ Settings
→ Environment Variables

# 4. Coller les variables (Environment: Production)

# 5. Redéployer
Deployments → Menu ⋮ → Redeploy
```

### Option B : Utiliser Vercel CLI (30 sec)

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables automatiquement
vercel env add STRIPE_SECRET_KEY production < .env.stripe
vercel env add VITE_STRIPE_PUBLISHABLE_KEY production < .env.stripe
vercel env add STRIPE_PRICE_PRO production < .env.stripe
vercel env add STRIPE_PRICE_BUSINESS production < .env.stripe
vercel env add STRIPE_WEBHOOK_SECRET production < .env.stripe

# Redéployer
vercel --prod
```

---

## ✅ Vérifier que ça marche

```bash
# Test API
curl https://www.pingenx.io/api/config

# Résultat attendu :
{
  "stripe": {
    "configured": true,
    "live": true,  ← Doit être true !
    "publishableKey": "pk_live_..."
  }
}
```

Si `"live": true` → **🎉 C'EST BON !**

---

## 🧪 Tester le flux complet

```bash
# 1. Aller sur https://www.pingenx.io/signup
# 2. Créer un compte
# 3. Choisir Pro ou Business
# 4. Checkout Stripe s'ouvre ✅
# 5. Entrer une VRAIE carte (pas 4242...)
# 6. Vérifier sur Stripe Dashboard :
#    → https://dashboard.stripe.com/customers ✅
#    → https://dashboard.stripe.com/subscriptions ✅
```

---

## 🔄 Si vous voulez recommencer

```bash
# Le script est idempotent
# Vous pouvez le relancer sans problème

STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe

# Il réutilisera les produits existants
# Ou créera ce qui manque
```

---

## 🚨 Troubleshooting

### "STRIPE_SECRET_KEY non définie"
```bash
# Solution : Passer la clé
STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe
```

### "stripe: not found" ou erreur npm
```bash
# Installer les dépendances
npm install

# Réessayer
STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe
```

### Mode Test au lieu de Live
```bash
# Vérifiez que la clé commence par sk_live_
# Pas sk_test_ !

# Récupérez la bonne clé sur :
https://dashboard.stripe.com/apikeys
# Mode Live activé (toggle en haut à droite)
```

---

## 📚 Documentation complète

- **Scripts** : `scripts/README.md`
- **Guide rapide** : `QUICK_START_LIVE.md`
- **Checklist complète** : `GO_LIVE_CHECKLIST.md`
- **Documentation détaillée** : `STRIPE_LIVE_SETUP.md`

---

## 🎯 Commande complète (tout en un)

```bash
# 1. Récupérer la clé sur https://dashboard.stripe.com/apikeys
# 2. Exécuter :

STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe && \
cat .env.stripe && \
echo "\n✅ Maintenant : Copiez ces variables dans Vercel !"
```

---

## 🎉 Résumé

**Avant** (manuel) : 30 minutes
- ❌ Créer les produits manuellement
- ❌ Copier les IDs
- ❌ Configurer le webhook
- ❌ Risque d'erreur

**Maintenant** (automatique) : 3 minutes
- ✅ 1 commande
- ✅ Tout est créé
- ✅ Variables générées
- ✅ Prêt à déployer

**Gain de temps : 90% ⚡**
