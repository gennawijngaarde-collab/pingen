# Configuration Google OAuth pour GenX

## ⚠️ Problème actuel
Erreur "serveur introuvable" lors de la connexion Google.

**Cause** : Google OAuth n'est pas configuré correctement dans Supabase ou Google Cloud Console.

---

## 🔧 Solution : Configuration en 2 étapes

### Étape 1 : Configurer Google Cloud Console

#### 1.1 Créer un projet Google Cloud
1. Allez sur : https://console.cloud.google.com/
2. Créez un nouveau projet ou sélectionnez-en un existant
3. Nom du projet : **GenX** ou **HRTECH Studio**

#### 1.2 Activer Google+ API
1. Dans le menu : **APIs & Services** → **Library**
2. Recherchez : **Google+ API**
3. Cliquez sur **Enable**

#### 1.3 Créer les credentials OAuth
1. **APIs & Services** → **Credentials**
2. Cliquez **Create Credentials** → **OAuth client ID**
3. Type d'application : **Web application**
4. Nom : **GenX - Production**

#### 1.4 Configurer les URLs autorisées

**Authorized JavaScript origins:**
```
https://www.pingenx.io
https://[votre-projet].supabase.co
```

**Authorized redirect URIs:**
```
https://[votre-projet].supabase.co/auth/v1/callback
```

#### 1.5 Récupérer les clés
Après création, notez :
- **Client ID** : `xxxxx.apps.googleusercontent.com`
- **Client Secret** : `GOCSPX-xxxxx`

---

### Étape 2 : Configurer Supabase

#### 2.1 Accéder aux paramètres Supabase
1. Allez sur : https://supabase.com/dashboard/project/[votre-projet]/auth/providers
2. Ou : Dashboard → Authentication → Providers

#### 2.2 Activer Google Provider
1. Trouvez **Google** dans la liste des providers
2. Activez le toggle (ON)
3. Remplissez :
   - **Client ID (for OAuth)** : Votre Client ID Google
   - **Client Secret (for OAuth)** : Votre Client Secret Google
4. **Authorized Client IDs** : Laissez vide (ou ajoutez votre Client ID)

#### 2.3 Configurer le Redirect URL
Dans Supabase, vérifiez que cette URL est autorisée :
```
https://www.pingenx.io/**
```

Allez dans : **Authentication** → **URL Configuration**
- **Site URL** : `https://www.pingenx.io`
- **Redirect URLs** : Ajoutez `https://www.pingenx.io/**`

#### 2.4 Sauvegarder
Cliquez sur **Save** en bas de la page.

---

## 🧪 Tester la configuration

### Test 1 : Vérifier Supabase
1. Allez sur votre dashboard Supabase
2. Authentication → Providers
3. Google doit afficher **Enabled** en vert

### Test 2 : Tester la connexion
1. Allez sur https://www.pingenx.io
2. Cliquez sur **Sign up** ou **Login**
3. Cliquez sur le bouton **Google**
4. Vous devriez être redirigé vers la page de connexion Google
5. La page doit afficher "GenX" ou votre nom d'application

---

## 🔍 Vérification des URLs

### URLs importantes à vérifier :

**Supabase Callback URL :**
```
https://[votre-projet].supabase.co/auth/v1/callback
```

**Application Redirect URL :**
```
https://www.pingenx.io/dashboard
```

**Site URL dans Supabase :**
```
https://www.pingenx.io
```

---

## 🐛 Dépannage

### Si l'erreur persiste :

1. **Vérifiez le domaine Supabase**
   - Le domaine `.supabase.co` doit être autorisé dans Google Cloud Console

2. **Vérifiez les Redirect URIs**
   - Elles doivent correspondre EXACTEMENT (pas d'espace, pas de slash final différent)

3. **Attendez la propagation**
   - Les changements dans Google Cloud Console peuvent prendre 5-10 minutes

4. **Videz le cache**
   - Ctrl+F5 ou Cmd+Shift+R sur le navigateur

5. **Vérifiez les logs Supabase**
   - Dashboard → Logs → Auth Logs
   - Regardez les erreurs OAuth

---

## 📝 Checklist finale

- [ ] Projet Google Cloud créé
- [ ] Google+ API activée
- [ ] OAuth Client ID créé
- [ ] JavaScript origins configurées
- [ ] Redirect URIs configurées dans Google Cloud
- [ ] Client ID copié dans Supabase
- [ ] Client Secret copié dans Supabase
- [ ] Google Provider activé dans Supabase
- [ ] Site URL configurée dans Supabase (`https://www.pingenx.io`)
- [ ] Redirect URLs configurées dans Supabase
- [ ] Configuration sauvegardée
- [ ] Attendu 5-10 minutes pour propagation
- [ ] Test de connexion effectué

---

## 📧 Support

Si le problème persiste après avoir suivi tous les points :
- Email : support@pingenx.io
- Vérifiez les logs Supabase pour des erreurs détaillées
