# Guide de résolution : Échec connexion Pinterest (Authentication failed)

## ❌ Erreur actuelle
"Échec connexion Pinterest - Authentication failed."

Cette erreur se produit lors de l'échange du code OAuth avec Pinterest.

---

## 🔧 Solutions (dans l'ordre de probabilité)

### Solution 1 : Vérifier l'App Secret dans Vercel ⭐

**Problème :** L'App Secret est incorrect, manquant, ou mal configuré.

**Comment vérifier :**

1. Allez sur Pinterest : https://developers.pinterest.com/apps/1609578/
2. Trouvez votre **App secret** (commence par `pina_`)
3. Copiez-le exactement (attention aux espaces)

4. Allez sur Vercel : https://vercel.com/gennarros-projects/pingen/settings/environment-variables

5. Vérifiez la variable **`PINTEREST_APP_SECRET`** :
   - Si elle n'existe pas : créez-la
   - Si elle existe : vérifiez qu'elle correspond exactement à Pinterest
   - Format attendu : `pina_XXXXXXXXXXXXXXXXXXXXXXXX`

6. Après modification, **redéployez** :
   - Option A : Allez dans "Deployments" et cliquez "Redeploy"
   - Option B : Attendez 5 minutes pour auto-redéploiement

---

### Solution 2 : Vérifier le Redirect URI

**Problème :** Le Redirect URI ne correspond pas exactement.

**Dans Pinterest (https://developers.pinterest.com/apps/1609578/) :**

Vérifiez que vous avez ajouté EXACTEMENT :
```
https://www.pingenx.io/dashboard/settings
```

**Important :**
- ✅ Pas d'espace avant ou après
- ✅ Pas de slash final (`/` à la fin)
- ✅ HTTPS (pas HTTP)
- ✅ `www.pingenx.io` (pas `pingenx.io` sans www)

---

### Solution 3 : Vérifier le statut de l'app Pinterest

**Dans Pinterest (https://developers.pinterest.com/apps/1609578/) :**

1. Vérifiez que l'app est **"Active"** ou **"Approved"**
2. Si elle est "In Review" ou "Suspended", cela ne fonctionnera pas
3. Vérifiez que l'app a les permissions (scopes) nécessaires :
   - `boards:read`
   - `boards:write`
   - `pins:read`
   - `pins:write`
   - `user_accounts:read`

---

### Solution 4 : Variables d'environnement multiples

**Vérifier dans Vercel que vous avez TOUTES ces variables :**

```
PINTEREST_APP_ID=1609578
PINTEREST_APP_SECRET=pina_votre_secret_ici
VITE_PINTEREST_APP_ID=1609578
```

**Note :** `VITE_PINTEREST_APP_ID` est pour le frontend, `PINTEREST_APP_SECRET` est pour le backend.

---

## 🧪 Test après configuration

1. Attendez 2-3 minutes après modification Vercel
2. Videz le cache (Ctrl+F5)
3. Réessayez la connexion Pinterest
4. Si ça ne fonctionne toujours pas, passez à la solution suivante

---

## 📊 Checklist de vérification

- [ ] App Secret copié correctement depuis Pinterest
- [ ] App Secret configuré dans Vercel (`PINTEREST_APP_SECRET`)
- [ ] Redirect URI ajouté dans Pinterest (`https://www.pingenx.io/dashboard/settings`)
- [ ] Redirect URI correspond exactement (pas d'espace, pas de slash final)
- [ ] App Pinterest est "Active" ou "Approved"
- [ ] Variables Vercel incluent `PINTEREST_APP_ID` et `VITE_PINTEREST_APP_ID`
- [ ] Redéployé Vercel après modifications
- [ ] Attendu 2-3 minutes
- [ ] Cache navigateur vidé
- [ ] Test de connexion effectué

---

## 🆘 Si rien ne fonctionne

Vérifiez les logs Vercel pour voir l'erreur exacte :
1. https://vercel.com/gennarros-projects/pingen/logs
2. Filtrez par "Function Logs"
3. Cherchez les erreurs contenant "pinterest" ou "oauth"
4. Partagez le message d'erreur exact

---

## 💡 Astuce pour déboguer

Vous pouvez tester l'API directement :
```bash
curl -X POST https://www.pingenx.io/api/pinterest/oauth/token \
  -H "Content-Type: application/json" \
  -d '{"code":"test","redirect_uri":"https://www.pingenx.io/dashboard/settings","grant_type":"authorization_code"}'
```

Si vous voyez "App ID / Secret manquants", c'est que les variables Vercel ne sont pas configurées.

---

Email de support : support@pingenx.io
