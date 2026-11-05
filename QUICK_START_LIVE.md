# 🚀 Démarrage Rapide - Stripe Live

## Configuration en 5 minutes chrono ! ⏱️

---

## 1️⃣ Obtenir vos clés Stripe Live (2 min)

### Sur Stripe Dashboard
1. Allez sur https://dashboard.stripe.com/apikeys
2. **Basculez en mode Live** (toggle en haut à droite)
3. Copiez vos clés :

```bash
STRIPE_SECRET_KEY=sk_live_51...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 2️⃣ Créer les produits Stripe (2 min)

### Pro - 19€/mois
https://dashboard.stripe.com/products/create

- **Name**: `GenX Pro`
- **Price**: `19.00 EUR` / `Monthly`
- **Free trial**: `7 days` ✅
- **→ Copier le Price ID**: `price_xxx...`

### Business - 49€/mois
https://dashboard.stripe.com/products/create

- **Name**: `GenX Business`
- **Price**: `49.00 EUR` / `Monthly`
- **Free trial**: `7 days` ✅
- **→ Copier le Price ID**: `price_yyy...`

---

## 3️⃣ Configurer Vercel (1 min)

### Vercel Dashboard → Settings → Environment Variables

Ajoutez ces variables en mode **Production** :

```bash
STRIPE_SECRET_KEY=sk_live_51...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_PRO=price_xxx...
STRIPE_PRICE_BUSINESS=price_yyy...
```

**Puis cliquez sur "Save" et redéployez !**

---

## 4️⃣ Vérifier que ça marche ✅

### Option A : Script automatique
```bash
./scripts/check-stripe-live.sh
```

### Option B : Test manuel
1. Allez sur https://www.pingenx.io/signup
2. Créez un compte
3. Choisissez Pro ou Business
4. Checkout Stripe s'ouvre ✅
5. Utilisez une vraie carte (plus de 4242...)
6. Vérifiez sur https://dashboard.stripe.com/customers

---

## 🎉 C'est tout !

**Votre app est maintenant en mode Live avec Stripe.**

Tous les nouveaux utilisateurs passeront par le Checkout automatiquement avec 7 jours d'essai gratuit.

---

## 📊 Où voir vos utilisateurs ?

### Stripe Dashboard
- **Clients** : https://dashboard.stripe.com/customers
- **Abonnements** : https://dashboard.stripe.com/subscriptions
- **Paiements** : https://dashboard.stripe.com/payments

### Filtres utiles
- **Trialing** : Essais en cours (0-7 jours)
- **Active** : Abonnements payants actifs
- **Past due** : Paiements échoués

---

## 🚨 Besoin d'aide ?

Consultez la documentation complète : **STRIPE_LIVE_SETUP.md**
