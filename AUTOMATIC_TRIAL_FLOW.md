# Flux d'essai gratuit automatique avec Stripe

## 🎯 Vue d'ensemble

Tous les nouveaux utilisateurs sont maintenant **automatiquement dirigés vers le Checkout Stripe** avec un **essai gratuit de 7 jours** dès leur inscription.

---

## 📋 Nouveau flux utilisateur

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│  1. INSCRIPTION                                                    │
│     ↓                                                              │
│     → Utilisateur crée un compte (email/password ou OAuth)         │
│     → Utilisateur créé dans Supabase avec plan 'starter'          │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  2. SÉLECTION DE PLAN (OBLIGATOIRE)                               │
│     ↓                                                              │
│     → Redirection automatique vers /onboarding/select-plan         │
│     → Choix entre Pro (19€/mois) et Business (49€/mois)           │
│     → Affichage clair : "Essai gratuit de 7 jours"                │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  3. CHECKOUT STRIPE (OBLIGATOIRE)                                  │
│     ↓                                                              │
│     → Redirection vers Stripe Checkout                             │
│     → L'utilisateur entre ses coordonnées de carte bancaire        │
│     → Aucun paiement pendant 7 jours                               │
│     → Client Stripe créé                                           │
│     → Abonnement Stripe créé avec statut 'trialing'                │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  4. CONFIRMATION                                                   │
│     ↓                                                              │
│     → Webhook Stripe 'checkout.session.completed'                  │
│     → Mise à jour du profil Supabase (plan = 'pro' ou 'business') │
│     → Redirection vers /dashboard/settings?tab=billing             │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  5. ACCÈS AU DASHBOARD                                             │
│     ↓                                                              │
│     → Accès complet au dashboard avec plan Pro/Business            │
│     → Essai actif pendant 7 jours                                  │
│     → Après 7 jours : Premier paiement automatique                 │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Protection des routes

### ProtectedRoute amélioré

Le composant `ProtectedRoute` vérifie maintenant :
1. ✅ Si l'utilisateur est authentifié
2. ✅ Si l'utilisateur a un plan payant (Pro/Business)
3. ❌ Si l'utilisateur est en plan 'starter' → Redirection vers `/onboarding/select-plan`

**Résultat** : Impossible d'accéder au dashboard sans avoir complété le Checkout Stripe.

---

## 📊 Quand verrez-vous des données sur Stripe ?

### Avant (flux ancien)
- ❌ Inscription → Rien sur Stripe
- ❌ Utilisateur pouvait utiliser l'app gratuitement sans jamais payer
- ❌ Upgrade manuel (très peu de conversions)

### Maintenant (flux automatique)
- ✅ Inscription → Sélection de plan → Checkout Stripe
- ✅ Client + Abonnement créés immédiatement
- ✅ Essai de 7 jours avec carte enregistrée
- ✅ Paiement automatique après 7 jours
- ✅ Vous voyez TOUS les utilisateurs sur Stripe Dashboard

---

## 🗂️ Fichiers modifiés

### Nouveaux fichiers
- `src/pages/onboarding/SelectPlan.tsx` - Page de sélection de plan obligatoire
- `AUTOMATIC_TRIAL_FLOW.md` - Cette documentation

### Fichiers modifiés
- `src/pages/auth/Signup.tsx` - Redirection vers `/onboarding/select-plan`
- `src/components/routing/ProtectedRoute.tsx` - Vérification du plan
- `src/lib/routes.ts` - Ajout de la route `selectPlan`
- `src/App.tsx` - Ajout de la route SelectPlan

---

## ⚡ Avantages du nouveau flux

### Pour vous (entreprise)
- ✅ **Meilleure conversion** : Tous les signups passent par Stripe
- ✅ **Moins d'abandon** : Carte enregistrée = paiement automatique
- ✅ **Prédictibilité** : Vous voyez tous vos futurs revenus
- ✅ **Données claires** : Stripe Dashboard = source unique de vérité
- ✅ **Moins d'abus** : Carte requise dès l'inscription

### Pour vos utilisateurs
- ✅ **Essai gratuit clair** : 7 jours gratuits affichés en grand
- ✅ **Aucun risque** : Annulation facile pendant l'essai
- ✅ **Expérience fluide** : Tout est automatique après le Checkout
- ✅ **Pas de surprise** : Ils savent exactement quand ils seront facturés

---

## 📅 Timeline d'un utilisateur type

| Date | Événement | Stripe Dashboard | Supabase |
|------|-----------|------------------|----------|
| **J0** (Inscription) | Signup → SelectPlan → Checkout | ✅ Client créé<br>✅ Abonnement 'trialing' | ✅ Plan = 'pro'/'business' |
| **J1-6** | Utilisation gratuite | Abonnement en essai | Plan actif |
| **J7** | Fin de l'essai | 🔥 Premier paiement tenté | Plan reste actif si paiement OK |
| **J7+** | Utilisateur payant | Statut = 'active' | Plan actif |

---

## 🔍 Vérification dans Stripe Dashboard

### Où voir les essais en cours ?
1. Allez sur [dashboard.stripe.com/subscriptions](https://dashboard.stripe.com/subscriptions)
2. Filtrez par statut : **"Trialing"**
3. Vous verrez tous les utilisateurs en essai gratuit

### Où voir quand l'essai se termine ?
- Colonne **"Trial ends"** dans la liste des abonnements
- Ou ouvrez un abonnement → Section "Trial"

---

## 🚨 Important

### Tous les nouveaux utilisateurs DOIVENT passer par le Checkout
- ❌ Pas d'accès au dashboard sans carte enregistrée
- ❌ Pas de contournement possible
- ✅ C'est le comportement attendu de l'Approche 2

### Utilisateurs existants
Les utilisateurs qui se sont inscrits AVANT cette mise à jour et qui sont en plan 'starter' :
- Seront également redirigés vers `/onboarding/select-plan`
- Devront compléter le Checkout pour accéder au dashboard
- **Recommandation** : Communiquez ce changement par email avant le déploiement

---

## 🎯 Prochaines étapes

### Optionnel - Améliorations futures
1. **Email de rappel avant la fin de l'essai** (J5-J6)
2. **Modal d'onboarding** après le Checkout (guide rapide)
3. **Analytics** sur les abandons de Checkout
4. **A/B testing** sur les prix Pro/Business

### À faire avant le déploiement
1. ✅ Tester le flux complet en mode test Stripe
2. ✅ Vérifier que les webhooks Stripe sont configurés
3. ⚠️ Communiquer aux utilisateurs existants
4. ✅ Passer en mode live Stripe

---

## 📞 Support

Si vous avez des questions sur ce nouveau flux :
- Vérifiez d'abord cette documentation
- Testez en mode test Stripe
- Consultez les logs Stripe dans `/api/stripe/webhook`
