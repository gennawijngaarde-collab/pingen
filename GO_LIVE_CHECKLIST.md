# ✅ Checklist pour passer en mode Live

## 🎯 Objectif
Activer Stripe en mode **LIVE** pour accepter de vrais paiements avec l'essai automatique de 7 jours.

---

## 📋 Avant de commencer

### Prérequis
- [ ] Compte Stripe activé et vérifié
- [ ] Compte bancaire connecté sur Stripe
- [ ] Application déployée sur Vercel
- [ ] Domaine `pingenx.io` configuré

---

## 🚀 Étapes de mise en production

### 1. Configuration Stripe (10 min)

#### 1.1 Basculer en mode Live
- [ ] Aller sur https://dashboard.stripe.com
- [ ] Toggle "Test data" → **OFF** (mode Live activé)

#### 1.2 Récupérer les clés API
- [ ] Aller sur https://dashboard.stripe.com/apikeys
- [ ] Copier `STRIPE_SECRET_KEY` : `sk_live_...`
- [ ] Copier `VITE_STRIPE_PUBLISHABLE_KEY` : `pk_live_...`

#### 1.3 Créer le produit Pro
- [ ] Aller sur https://dashboard.stripe.com/products/create
- [ ] **Name** : `GenX Pro`
- [ ] **Description** : `Plan Pro - 150 pins/mois + génération automatique`
- [ ] **Price** : `19.00 EUR` / `Monthly`
- [ ] **Free trial** : Cocher "Offer customers a free trial" → `7 days`
- [ ] Cliquer sur **Save**
- [ ] **Copier le Price ID** : `price_...` → Sauvegarder pour plus tard

#### 1.4 Créer le produit Business
- [ ] Aller sur https://dashboard.stripe.com/products/create
- [ ] **Name** : `GenX Business`
- [ ] **Description** : `Plan Business - 600 pins/mois + autopilot`
- [ ] **Price** : `49.00 EUR` / `Monthly`
- [ ] **Free trial** : Cocher "Offer customers a free trial" → `7 days`
- [ ] Cliquer sur **Save**
- [ ] **Copier le Price ID** : `price_...` → Sauvegarder pour plus tard

---

### 2. Configuration Vercel (5 min)

#### 2.1 Accéder aux variables d'environnement
- [ ] Aller sur https://vercel.com/dashboard
- [ ] Sélectionner le projet `pingen`
- [ ] **Settings** → **Environment Variables**

#### 2.2 Ajouter/Modifier les variables
Pour chaque variable, sélectionnez **Environment: Production**

- [ ] `STRIPE_SECRET_KEY` = `sk_live_...` (votre clé secrète live)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (votre clé publique live)
- [ ] `STRIPE_PRICE_PRO` = `price_...` (Price ID du plan Pro)
- [ ] `STRIPE_PRICE_BUSINESS` = `price_...` (Price ID du plan Business)

#### 2.3 Variables optionnelles mais recommandées
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_...` (voir section 3 ci-dessous)

#### 2.4 Redéployer
- [ ] Cliquer sur **Deployments**
- [ ] Cliquer sur le menu ⋮ du dernier déploiement
- [ ] Cliquer sur **Redeploy**
- [ ] Attendre la fin du déploiement (~2 min)

---

### 3. Configuration des Webhooks (5 min)

#### Option A : Configuration automatique (Recommandé)
Le webhook sera créé automatiquement au premier démarrage de l'app.

- [ ] Après le redéploiement, créez un compte test
- [ ] Vérifiez sur https://dashboard.stripe.com/webhooks
- [ ] Le webhook `https://www.pingenx.io/api/stripe/webhook` devrait apparaître

#### Option B : Configuration manuelle
Si l'auto-configuration échoue :

- [ ] Aller sur https://dashboard.stripe.com/webhooks
- [ ] Cliquer sur **Add endpoint**
- [ ] **Endpoint URL** : `https://www.pingenx.io/api/stripe/webhook`
- [ ] **Events to send** : Sélectionner
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
- [ ] Cliquer sur **Add endpoint**
- [ ] **Copier le Signing secret** : `whsec_...`
- [ ] Ajouter dans Vercel : `STRIPE_WEBHOOK_SECRET=whsec_...`
- [ ] Redéployer Vercel

---

### 4. Tests de vérification (10 min)

#### 4.1 Vérifier la configuration API
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

✅ Si `"live": true` → Mode Live activé !

#### 4.2 Test complet du flux

**⚠️ ATTENTION : Utilisez une vraie carte bancaire !**

- [ ] Aller sur https://www.pingenx.io/signup
- [ ] Créer un nouveau compte avec un email test (ex: `test+live@gmail.com`)
- [ ] Vérifier la redirection vers `/onboarding/select-plan`
- [ ] Cliquer sur **"Commencer l'essai gratuit"** (Pro ou Business)
- [ ] Vérifier que Stripe Checkout s'ouvre
- [ ] Entrer une **vraie carte bancaire** (pas 4242 4242 4242 4242)
- [ ] Compléter le paiement
- [ ] Vérifier la redirection vers `/dashboard/settings?tab=billing`
- [ ] Vérifier l'accès au dashboard complet

#### 4.3 Vérifications sur Stripe Dashboard

- [ ] Aller sur https://dashboard.stripe.com/customers
- [ ] Mode **Live** activé (toggle en haut à droite)
- [ ] Vérifier que le nouveau client apparaît ✅
- [ ] Aller sur https://dashboard.stripe.com/subscriptions
- [ ] Vérifier que l'abonnement est en statut **"Trialing"** ✅
- [ ] Vérifier que la date de fin d'essai est dans 7 jours ✅

#### 4.4 Vérifications sur Supabase

- [ ] Aller sur https://supabase.com → Votre projet
- [ ] **Table Editor** → Table `profiles`
- [ ] Rechercher l'email test
- [ ] Vérifier que `plan = 'pro'` ou `'business'` ✅
- [ ] **Table Editor** → Table `subscriptions`
- [ ] Vérifier que l'abonnement existe avec `status = 'active'` ✅

---

### 5. Communication aux utilisateurs (30 min)

#### 5.1 Préparer l'email
- [ ] Ouvrir `templates/email-existing-users.md`
- [ ] Copier le template HTML
- [ ] Personnaliser si nécessaire

#### 5.2 Segmenter les utilisateurs
- [ ] Exporter la liste des utilisateurs depuis Supabase
- [ ] Filtrer par `plan = 'starter'`
- [ ] Exclure les utilisateurs inscrits dans les dernières 24h

#### 5.3 Envoyer l'email
- [ ] Utiliser Resend (déjà configuré) ou votre outil d'emailing
- [ ] Envoyer un test à vous-même d'abord
- [ ] Si OK, envoyer à tous les utilisateurs

---

### 6. Monitoring post-déploiement (En continu)

#### 6.1 Logs Vercel
- [ ] Vercel Dashboard → **Logs**
- [ ] Filtrer par fonction : `api/stripe/webhook`
- [ ] Vérifier qu'il n'y a pas d'erreurs

#### 6.2 Dashboard Stripe
- [ ] Vérifier régulièrement les nouveaux abonnements
- [ ] Filtrer par statut : **"Trialing"**
- [ ] Suivre les conversions après 7 jours

#### 6.3 Supabase Database
- [ ] Vérifier que les profils sont bien mis à jour
- [ ] Vérifier que les subscriptions sont synchronisées

---

## 🎉 Félicitations !

Une fois toutes ces étapes complétées, votre application est officiellement en mode **Live** avec Stripe !

**Tous les nouveaux utilisateurs** passeront automatiquement par le Checkout Stripe avec un essai gratuit de 7 jours.

---

## 📊 Métriques à suivre

### Jour 1-7 (Période d'essai)
- Nombre d'inscriptions
- Nombre de Checkouts complétés
- Taux d'abandon du Checkout
- Essais actifs (Stripe → Subscriptions → Trialing)

### Jour 7+ (Fin d'essai)
- Nombre de paiements réussis (conversions)
- Nombre de paiements échoués
- Taux de rétention
- MRR (Monthly Recurring Revenue)

### Outils recommandés
- **Stripe Dashboard** : https://dashboard.stripe.com
- **PostHog** (déjà configuré) : Tracking des conversions
- **Sentry** (déjà configuré) : Monitoring des erreurs

---

## 🚨 Troubleshooting

### Problème : "Stripe is not configured"
**Solution** : Vérifiez que `STRIPE_SECRET_KEY` est bien défini sur Vercel et redéployez.

### Problème : "Stripe production keys required"
**Solution** : Vous utilisez `sk_test_...` au lieu de `sk_live_...`. Changez les clés sur Vercel.

### Problème : Les webhooks ne fonctionnent pas
**Solution** :
1. Vérifiez les logs Stripe : https://dashboard.stripe.com/webhooks
2. Vérifiez les logs Vercel : fonction `api/stripe/webhook`
3. Testez manuellement avec Stripe CLI

### Problème : L'essai gratuit ne démarre pas
**Solution** : Vérifiez que vous avez coché "Offer customers a free trial" lors de la création des produits Stripe.

### Problème : Les utilisateurs sont redirigés vers SelectPlan en boucle
**Solution** : Vérifiez que le webhook `checkout.session.completed` fonctionne et que le profil est bien mis à jour dans Supabase.

---

## 📞 Support

Pour toute question :
1. Consultez **STRIPE_LIVE_SETUP.md** (documentation complète)
2. Consultez **QUICK_START_LIVE.md** (guide rapide)
3. Exécutez `./scripts/check-stripe-live.sh` (vérification automatique)

---

## 🔗 Liens utiles

- **Stripe Dashboard** : https://dashboard.stripe.com
- **Stripe API Docs** : https://stripe.com/docs/api
- **Vercel Dashboard** : https://vercel.com/dashboard
- **Supabase Dashboard** : https://supabase.com
- **PR GitHub** : https://github.com/gennawijngaarde-collab/pingen/pull/2

---

**Date de mise à jour** : 5 novembre 2026
**Version** : 1.0.0
