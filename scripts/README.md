# 🛠️ Scripts GenX

## setup-stripe-live.ts

**Script d'automatisation Stripe Live** - Configure automatiquement Stripe en mode production.

### ✨ Ce que fait ce script

1. ✅ Crée le produit **GenX Pro** (19€/mois)
2. ✅ Crée le produit **GenX Business** (49€/mois)
3. ✅ Configure l'essai gratuit de **7 jours** pour les deux
4. ✅ Crée/vérifie le webhook Stripe automatiquement
5. ✅ Génère les variables d'environnement pour Vercel
6. ✅ Sauvegarde tout dans `.env.stripe`

### 🚀 Usage

#### Prérequis
- Clé Stripe Live (récupérée sur https://dashboard.stripe.com/apikeys)
- Mode Live activé sur Stripe Dashboard

#### Exécution
```bash
# Option 1 : Avec npm
STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe

# Option 2 : Directement avec tsx
STRIPE_SECRET_KEY=sk_live_... tsx scripts/setup-stripe-live.ts

# Option 3 : Avec .env local
echo "STRIPE_SECRET_KEY=sk_live_..." > .env
source .env
npm run setup-stripe
```

### 📋 Résultat

Le script affiche :
```
🚀 Configuration automatique de Stripe Live

✅ Clé Stripe LIVE détectée

📦 Étape 1/4 : Création du produit Pro...
✅ Produit Pro créé : prod_xxx
✅ Prix Pro créé : price_xxx (19€/mois, essai 7 jours)

📦 Étape 2/4 : Création du produit Business...
✅ Produit Business créé : prod_yyy
✅ Prix Business créé : price_yyy (49€/mois, essai 7 jours)

🔗 Étape 3/4 : Configuration du webhook...
✅ Webhook créé : we_zzz
   URL : https://www.pingenx.io/api/stripe/webhook

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

# Webhook Secret (optionnel mais recommandé)
STRIPE_WEBHOOK_SECRET=whsec_...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💾 Variables sauvegardées dans .env.stripe
```

### 🔧 Prochaines étapes après exécution

1. ✅ Ouvrir `.env.stripe` (généré automatiquement)
2. ✅ Copier toutes les variables
3. ✅ Aller sur https://vercel.com/dashboard
4. ✅ Projet `pingen` → Settings → Environment Variables
5. ✅ Ajouter les variables (Environment: **Production**)
6. ✅ Redéployer (Deployments → Redeploy)
7. ✅ Tester sur https://www.pingenx.io

### ⚠️ Sécurité

- ❌ **NE COMMITEZ PAS** `.env.stripe` dans Git
- ❌ **NE PARTAGEZ PAS** vos clés Stripe
- ✅ Le fichier est déjà dans `.gitignore`

### 🔄 Réexécution

Le script est **idempotent** :
- Si les produits existent déjà → Ignorés
- Si le webhook existe déjà → Réutilisé
- Vous pouvez le relancer sans risque

### 🐛 Troubleshooting

#### Erreur : "STRIPE_SECRET_KEY non définie"
```bash
# Solution : Passer la clé en variable d'environnement
STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe
```

#### Erreur : "Clé Stripe invalide"
```bash
# Vérifiez que la clé commence par sk_live_ ou sk_test_
# Récupérez-la sur : https://dashboard.stripe.com/apikeys
```

#### Erreur : "Product already exists"
```bash
# Les produits existent déjà sur Stripe
# Solution : Utilisez les Price IDs existants
# Ou supprimez les anciens produits sur Stripe Dashboard
```

### 📖 Voir aussi

- `check-stripe-live.sh` - Vérifier la configuration Stripe
- `STRIPE_LIVE_SETUP.md` - Guide complet Stripe Live
- `QUICK_START_LIVE.md` - Guide rapide
