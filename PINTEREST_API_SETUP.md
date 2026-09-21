# Configuration Pinterest API - GenX (App ID: 1609578)

## ✅ App ID mis à jour : 1609578

L'App ID a été mis à jour dans tous les fichiers de l'application.

---

## 🔑 Récupérer votre clé API Pinterest (App Secret)

### Étape 1 : Accédez à votre application
👉 **https://developers.pinterest.com/apps/1609578/**

### Étape 2 : Trouvez votre App Secret
1. Connectez-vous à votre compte Pinterest
2. Dans la page de votre application (ID: 1609578)
3. Cherchez la section **"App secret"**
4. Copiez la clé secrète (elle ressemble à : `pina_xxxxxxxxxxx`)

---

## 📝 Configuration dans Vercel

Une fois que vous avez votre App Secret, configurez-le dans Vercel :

### Option 1 : Via l'interface Vercel
1. Allez sur https://vercel.com/gennarros-projects/pingen/settings/environment-variables
2. Ajoutez une nouvelle variable :
   - **Name:** `PINTEREST_APP_SECRET`
   - **Value:** Votre App Secret (pina_xxx...)
   - **Environments:** Production, Preview, Development
3. Cliquez sur "Save"
4. Redéployez l'application

### Option 2 : Via Vercel CLI
```bash
vercel env add PINTEREST_APP_SECRET
# Collez votre App Secret quand demandé
# Sélectionnez : Production, Preview, Development
```

---

## 🔧 Configuration locale (.env)

Pour le développement local, créez/mettez à jour votre fichier `.env` :

```env
# Pinterest API
VITE_PINTEREST_APP_ID=1609578
VITE_PINTEREST_APP_SECRET=pina_VOTRE_CLE_SECRETE_ICI
PINTEREST_APP_ID=1609578
PINTEREST_APP_SECRET=pina_VOTRE_CLE_SECRETE_ICI
```

---

## 🌐 Redirect URIs à configurer sur Pinterest

Dans les paramètres de votre app Pinterest, assurez-vous que ces URIs sont autorisées :

**Production :**
```
https://www.hrtech-studio.com/dashboard/settings
```

**Preview Vercel (optionnel) :**
```
https://pingen-*.vercel.app/dashboard/settings
```

**Développement local :**
```
http://localhost:5173/dashboard/settings
```

---

## ✅ Vérification

Après configuration :

1. Les utilisateurs pourront se connecter avec Pinterest
2. Le flux OAuth fonctionnera correctement
3. Les pins pourront être créés et publiés sur Pinterest

---

## 🔗 Liens utiles

- **App Dashboard:** https://developers.pinterest.com/apps/1609578/
- **Documentation API:** https://developers.pinterest.com/docs/api/v5/
- **OAuth Guide:** https://developers.pinterest.com/docs/getting-started/authentication/

---

## 📧 Support

Email de support : support@hrtech-studio.com
