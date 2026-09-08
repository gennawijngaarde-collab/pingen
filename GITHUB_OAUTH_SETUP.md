# Configuration GitHub OAuth - GenX

## 🎯 Application OAuth à configurer

### Accès rapide
👉 **https://github.com/settings/developers**

---

## ⚙️ Paramètres à mettre à jour

### 1. Logo de l'application
**Action :** Upload le fichier `public/genx-logo.jpg`

**Emplacement :** Section "Application logo" → "Upload new logo"

---

### 2. Informations de l'application

| Champ | Valeur |
|-------|--------|
| **Application name** | GenX |
| **Homepage URL** | https://www.hrtech-studio.com |
| **Application description** | GenX - Automate your Pinterest content creation, scheduling, and optimization at scale. Save time and grow your audience with AI-powered Pinterest automation. |

---

### 3. URLs de callback

**Authorization callback URL:**
```
https://www.hrtech-studio.com/auth/callback
```

**Alternative (si besoin):**
```
https://www.hrtech-studio.com/api/auth/callback
http://localhost:5173/auth/callback (pour le dev)
```

---

### 4. Branding supplémentaire (optionnel)

**Badge color:** `#3B9EFF` (GenX Blue)

**Theme:** Light ou Auto

---

## ✅ Checklist de vérification

- [ ] Logo uploadé (genx-logo.jpg)
- [ ] Nom de l'application : "GenX"
- [ ] Homepage URL : hrtech-studio.com
- [ ] Description mise à jour
- [ ] Callback URLs configurées
- [ ] Application activée

---

## 📧 Contact après configuration

Une fois terminé, l'application GitHub OAuth affichera :
- ✨ Le logo GenX
- 🎨 Les couleurs de la marque
- 📝 Les bonnes informations de contact

**Email de support :** support@hrtech-studio.com
