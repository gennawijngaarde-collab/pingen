# 🎯 CONFIGURATION RAPIDE (2 options)

## Option 1: Script Automatique (Recommandé)

**Sur ton ordinateur local**, ouvre un terminal et exécute:

```bash
curl -s https://raw.githubusercontent.com/gennawijngaarde-collab/pingen/main/setup-autopilot.sh | bash
```

✅ Ça configure GitHub automatiquement!

---

## Option 2: Manuel (si script ne marche pas)

### GitHub Secret
1. Va sur: https://github.com/gennawijngaarde-collab/pingen/settings/secrets/actions
2. Clique "New repository secret"
3. Name: `CRON_SECRET`
4. Value: `VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw=`
5. Clique "Add secret"

---

## ⚠️ Dans TOUS les cas: Vercel

1. Va sur: https://vercel.com/gennarros-projects/genx/settings/environment-variables
2. Clique "Add New"
3. Key: `CRON_SECRET`
4. Value: `VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw=`
5. Coche: **Production + Preview + Development**
6. Clique "Save"

---

## 🚀 Résultat

Après config (dans 10 min):
- ✅ GitHub Actions publie automatiquement
- ✅ Autopilote SaaS actif 24/7
- ✅ Tes 4 pins seront publiés
