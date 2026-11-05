# 📧 Guide : Email aux utilisateurs existants

## 🎯 Objectif

Envoyer un email à vos **utilisateurs existants** (plan Starter) pour leur offrir **7 jours d'essai gratuit** des plans Pro ou Business.

---

## 📋 Prérequis

### 1. Compte Resend configuré

Vous devez avoir un compte **Resend** (service d'envoi d'emails) :

1. Créez un compte sur https://resend.com
2. Vérifiez votre domaine `pingenx.io` ou utilisez un domaine Resend temporaire
3. Récupérez votre clé API depuis https://resend.com/api-keys
   - Format : `re_...`

### 2. Variables d'environnement

Vous avez besoin de ces variables :

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx          # Depuis Resend.com
RESEND_FROM="GenX <contact@pingenx.io>" # Adresse d'envoi
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...     # Clé service role (pas anon!)
```

---

## 🚀 Utilisation

### Étape 1 : Test en mode DRY RUN (Recommandé)

Testez d'abord **sans envoyer réellement** les emails :

```bash
cd /agent/repos/pingen

# Définissez vos variables
export RESEND_API_KEY="re_xxxxxxxxxxxx"
export VITE_SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."

# Lancez en mode test (DRY_RUN=true par défaut)
npm run send-email
```

**Résultat attendu :**
```
🚀 Envoi des emails aux utilisateurs existants

⚠️  MODE DRY RUN activé (aucun email ne sera envoyé)
   Pour envoyer réellement : DRY_RUN=false npm run send-email

📊 Récupération des utilisateurs éligibles...
✅ 42 utilisateurs trouvés

  [DRY RUN] Envoi vers user1@example.com (John)
  [DRY RUN] Envoi vers user2@example.com (Marie)
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Résumé (DRY RUN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total : 42 utilisateurs
✅ Envoyés : 42
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Pour envoyer réellement les emails :
   DRY_RUN=false npm run send-email
```

### Étape 2 : Envoi test à vous-même

Avant l'envoi massif, testez avec **un seul email** :

```bash
# Modifiez temporairement le script pour filtrer sur votre email
# Ou testez manuellement avec curl :

curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "GenX <contact@pingenx.io>",
    "to": ["votre-email@example.com"],
    "subject": "🎁 Profitez de 7 jours d'\''essai gratuit GenX Pro/Business !",
    "html": "<p>Test</p>"
  }'
```

Vérifiez :
- ✅ L'email arrive bien
- ✅ Le design est correct
- ✅ Les liens fonctionnent
- ✅ Pas dans les spams

### Étape 3 : Envoi réel

Une fois satisfait du test, lancez l'envoi réel :

```bash
# ⚠️ ATTENTION : Ceci enverra RÉELLEMENT les emails !
DRY_RUN=false npm run send-email
```

**Résultat :**
```
🚀 Envoi des emails aux utilisateurs existants

📊 Récupération des utilisateurs éligibles...
✅ 42 utilisateurs trouvés

  ✅ user1@example.com
  ✅ user2@example.com
  ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Résumé
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total : 42 utilisateurs
✅ Envoyés : 42
❌ Échecs : 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📊 Qui recevra l'email ?

Le script cible automatiquement :

✅ **Utilisateurs avec plan `starter`** (utilisateurs existants qui n'ont pas encore migré)
✅ **Avec une adresse email valide**
✅ **Triés par date d'inscription (du plus récent au plus ancien)**

❌ Les nouveaux utilisateurs (inscrits après le déploiement du flux automatique) ne recevront PAS l'email car ils voient déjà le nouveau flux.

---

## 📈 Métriques attendues

D'après le template, vous pouvez espérer :

- **Taux d'ouverture** : ~20-30%
- **Taux de clic** : ~5-10%
- **Taux de conversion** (essai activé) : ~2-5%

### Suivi dans Resend

1. Connectez-vous sur https://resend.com/emails
2. Suivez les statistiques en temps réel :
   - Emails envoyés
   - Emails ouverts
   - Clics sur les liens
   - Bounces / Échecs

---

## 🎨 Contenu de l'email

### Sujet
```
🎁 Profitez de 7 jours d'essai gratuit GenX Pro/Business !
```

### Contenu principal

L'email annonce :
- 🎉 Le nouveau système d'essai gratuit de 7 jours
- 🚀 Les fonctionnalités du plan Pro (19€/mois)
- 💼 Les fonctionnalités du plan Business (49€/mois)
- 🎁 Sans engagement, annulation à tout moment
- 👉 Lien direct vers https://www.pingenx.io/login

---

## 🔒 Sécurité

### Clés sensibles

⚠️ **Ne commitez JAMAIS les clés API** :
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Rate Limits

Le script inclut une pause de **100ms entre chaque email** pour respecter les limites de Resend.

Si vous avez beaucoup d'utilisateurs (>500), considérez :
- Envoyer par lots de 500
- Augmenter la pause entre chaque email

---

## 📝 Segmentation avancée (optionnelle)

Si vous voulez segmenter vos utilisateurs, modifiez la requête Supabase dans le script :

```typescript
// Utilisateurs actifs uniquement (dernière connexion < 7 jours)
.gte('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

// Utilisateurs inactifs uniquement (dernière connexion > 7 jours)
.lt('last_sign_in_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

// Limiter le nombre d'envois
.limit(100)
```

---

## 💡 Conseils

1. **Planifiez l'envoi** : Envoyez en semaine, entre 10h-11h ou 14h-16h (meilleur taux d'ouverture)
2. **Personnalisez** : Le script utilise automatiquement le prénom de l'utilisateur
3. **Évitez le spam** : N'envoyez pas plusieurs fois le même email
4. **Suivez les résultats** : Consultez Resend après 24-48h
5. **Préparez le support** : Anticipez des questions sur le nouveau système

---

## 🐛 Dépannage

### Erreur : RESEND_API_KEY non définie

```bash
❌ ERREUR : RESEND_API_KEY non définie
```

**Solution :** Définissez la variable :
```bash
export RESEND_API_KEY="re_xxxxxxxxxxxx"
```

### Erreur : Variables Supabase non définies

```bash
❌ ERREUR : Variables Supabase non définies
```

**Solution :** Définissez les deux variables :
```bash
export VITE_SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJxxx..."
```

### Aucun utilisateur trouvé

```bash
ℹ️  Aucun utilisateur éligible trouvé
```

**Raisons possibles :**
- Tous vos utilisateurs ont déjà un plan Pro/Business
- Pas d'utilisateurs avec le plan 'starter'
- Vérifiez votre base de données Supabase

### Emails bloqués / Spam

Si les emails tombent dans les spams :
1. Vérifiez votre domaine sur Resend (SPF, DKIM)
2. Évitez trop d'emojis / mots "marketing"
3. Ajoutez un lien de désabonnement (optionnel)

---

## 📞 Support

Si vous rencontrez un problème :
1. Consultez les logs du script
2. Vérifiez les métriques sur https://resend.com
3. Testez d'abord avec un petit groupe (<10 utilisateurs)

---

**Date de création** : 5 novembre 2026  
**Script** : `scripts/send-existing-users-email.ts`  
**Commande** : `npm run send-email`
