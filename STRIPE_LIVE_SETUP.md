# 🔥 Configuration Stripe LIVE (Production)

## ⚠️ IMPORTANT : Mode Live = Vrais paiements

En mode **LIVE**, vous utilisez de **vraies cartes bancaires** et **de vrais paiements** sont traités.
- ✅ Les clients sont réellement facturés
- ✅ L'argent arrive sur votre compte Stripe
- ⚠️ Pas de cartes de test (4242...)

---

## 📋 Étapes de configuration

### 1️⃣ Obtenir vos clés Stripe Live

#### Sur Stripe Dashboard
1. Allez sur https://dashboard.stripe.com/apikeys
2. **Activez le mode "Live"** (en haut à droite, toggle "Test data" → OFF)
3. Notez vos clés :

```bash
# Clé secrète (côté serveur)
STRIPE_SECRET_KEY=sk_live_51...

# Clé publique (côté client)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

⚠️ **ATTENTION** : Ne commitez JAMAIS ces clés dans Git !

---

### 2️⃣ Créer les produits et prix sur Stripe

#### Créer le plan Pro (19€/mois)
1. Stripe Dashboard → **Products** → **Add product**
2. Remplissez :
   - **Name** : `GenX Pro`
   - **Description** : `Plan Pro - 150 pins/mois + génération automatique`
   - **Pricing** :
     - Type : `Recurring`
     - Amount : `19.00 EUR`
     - Billing period : `Monthly`
   - **Free trial** : `7 days` ✅
3. Cliquez sur **Save**
4. **Copiez le Price ID** : `price_xxxxxxxxxxxxx`

#### Créer le plan Business (49€/mois)
1. **Add product** à nouveau
2. Remplissez :
   - **Name** : `GenX Business`
   - **Description** : `Plan Business - 600 pins/mois + autopilot`
   - **Pricing** :
     - Type : `Recurring`
     - Amount : `49.00 EUR`
     - Billing period : `Monthly`
   - **Free trial** : `7 days` ✅
3. Cliquez sur **Save**
4. **Copiez le Price ID** : `price_xxxxxxxxxxxxx`

---

### 3️⃣ Configuration des variables d'environnement

#### Option A : Déploiement Vercel (Production)
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `pingen`
3. **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

```bash
# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_51...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Price IDs (copiés depuis Stripe)
STRIPE_PRICE_PRO=price_... # Price ID du plan Pro
STRIPE_PRICE_BUSINESS=price_... # Price ID du plan Business

# Webhook secret (optionnel, mais recommandé)
STRIPE_WEBHOOK_SECRET=whsec_... # Généré après configuration webhook
```

5. Sélectionnez l'environnement : **Production**
6. Cliquez sur **Save**

#### Option B : Développement local
1. Créez un fichier `.env` à la racine du projet :

```bash
cp .env.example .env
```

2. Éditez `.env` et remplissez :

```bash
# Stripe LIVE
STRIPE_SECRET_KEY=sk_live_51...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

# App URL (production)
VITE_APP_URL=https://www.pingenx.io

# Autres configs (Supabase, etc.)
# ... (voir .env.example)
```

3. **NE COMMITEZ PAS `.env`** (déjà dans .gitignore)

---

### 4️⃣ Configurer les webhooks Stripe

Les webhooks permettent à Stripe de notifier votre app quand un paiement est effectué, un abonnement est créé, etc.

#### Configuration automatique (Recommandé)
Votre app crée **automatiquement** le webhook lors du premier démarrage grâce à `ensureStripeWebhook()`.

URL du webhook : `https://www.pingenx.io/api/stripe/webhook`

#### Configuration manuelle (Si auto échoue)
1. Stripe Dashboard → **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. **Endpoint URL** : `https://www.pingenx.io/api/stripe/webhook`
4. **Events to send** : Sélectionnez ces événements :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.paid`
   - ✅ `invoice.payment_failed`
5. Cliquez sur **Add endpoint**
6. **Copiez le Signing secret** : `whsec_...`
7. Ajoutez-le dans Vercel : `STRIPE_WEBHOOK_SECRET=whsec_...`

---

### 5️⃣ Vérifier la configuration

#### Test 1 : API Config
```bash
curl https://www.pingenx.io/api/config
```

Résultat attendu :
```json
{
  "stripe": {
    "configured": true,
    "live": true,
    "publishableKey": "pk_live_..."
  }
}
```

✅ Si `"live": true` → Vous êtes en mode LIVE !

#### Test 2 : Créer un compte test
1. Allez sur https://www.pingenx.io/signup
2. Créez un nouveau compte
3. Vous êtes redirigé vers `/onboarding/select-plan`
4. Cliquez sur **"Commencer l'essai gratuit"**
5. Vous êtes redirigé vers Stripe Checkout

⚠️ **Utilisez une VRAIE carte** (plus de 4242 4242 4242 4242)

#### Test 3 : Vérifier sur Stripe Dashboard
1. Allez sur https://dashboard.stripe.com/customers
2. Mode **Live** activé
3. Vous devriez voir votre nouveau client ✅
4. Allez sur **Subscriptions**
5. Vous devriez voir l'abonnement en statut **"Trialing"** ✅

---

## 🔍 Vérifications de sécurité

### ✅ Checklist avant mise en production

- [ ] Mode Live activé sur Stripe Dashboard
- [ ] Clés `sk_live_...` et `pk_live_...` configurées sur Vercel
- [ ] Prix créés sur Stripe avec essai de 7 jours
- [ ] STRIPE_PRICE_PRO et STRIPE_PRICE_BUSINESS configurés
- [ ] Webhook configuré et pointant vers `/api/stripe/webhook`
- [ ] STRIPE_WEBHOOK_SECRET configuré (optionnel mais recommandé)
- [ ] Test complet du flow signup → checkout → dashboard
- [ ] Vérification que l'abonnement apparaît sur Stripe Dashboard
- [ ] .env local PAS committé dans Git

---

## 📊 Monitoring en production

### Où voir les paiements ?

#### Stripe Dashboard → Payments
Tous les paiements réussis et échoués

#### Stripe Dashboard → Subscriptions
Filtrez par :
- **Trialing** : Essais en cours (7 jours)
- **Active** : Abonnements payants actifs
- **Canceled** : Abonnements annulés

#### Vercel Logs
1. Vercel Dashboard → **Logs**
2. Filtrez par fonction : `api/stripe/webhook`
3. Vous verrez tous les événements Stripe reçus

---

## 🚨 Résolution de problèmes

### "Stripe is not configured"
- Vérifiez que `STRIPE_SECRET_KEY` est bien défini sur Vercel
- Redéployez l'application

### "Stripe production keys required"
Votre domaine `pingenx.io` **requiert** des clés live (pas de test en prod).
- Solution : Utilisez `sk_live_...` au lieu de `sk_test_...`

### Les webhooks ne fonctionnent pas
1. Vérifiez les logs Stripe : https://dashboard.stripe.com/webhooks
2. Vérifiez les logs Vercel : fonction `api/stripe/webhook`
3. Testez manuellement : 
   ```bash
   stripe trigger checkout.session.completed
   ```

### L'essai gratuit ne démarre pas
- Vérifiez que vous avez activé "Free trial: 7 days" sur les produits Stripe
- Vérifiez que `TRIAL_PERIOD_DAYS = 7` dans `server/stripe.ts`

---

## 💰 Facturation et revenus

### Quand serez-vous payé ?

1. **Essai de 7 jours** : Aucun paiement
2. **Jour 7** : Premier paiement automatique (19€ ou 49€)
3. **Tous les mois** : Renouvellement automatique
4. **Transfert vers votre compte bancaire** : 
   - Stripe Dashboard → **Payouts**
   - Par défaut : tous les 7 jours
   - Configurable : quotidien, hebdomadaire, mensuel

### Frais Stripe
- **2.9% + 0.25€** par transaction réussie
- Pas de frais pour les essais gratuits
- Pas de frais pour les abonnements annulés pendant l'essai

---

## ✅ C'est prêt !

Une fois ces étapes complétées, votre application GenX est en mode **LIVE** avec Stripe.

**Tous les nouveaux utilisateurs** passeront automatiquement par le Checkout Stripe avec l'essai gratuit de 7 jours.

🎉 **Félicitations !** Vous êtes maintenant prêt à accepter de vrais paiements !
