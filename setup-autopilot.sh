#!/bin/bash

# GenX SaaS - Configuration Autopilote
# Exécute ce script sur ton ordinateur local

echo "🚀 Configuration de l'autopilote GenX..."
echo ""

CRON_SECRET="VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw="

# Ajouter le secret dans GitHub
echo "📝 Ajout du secret CRON_SECRET dans GitHub..."
echo "$CRON_SECRET" | gh secret set CRON_SECRET --repo gennawijngaarde-collab/pingen

if [ $? -eq 0 ]; then
  echo "✅ Secret GitHub configuré avec succès!"
else
  echo "❌ Erreur lors de la configuration GitHub"
  echo "👉 Va manuellement sur: https://github.com/gennawijngaarde-collab/pingen/settings/secrets/actions"
  exit 1
fi

echo ""
echo "✅ GITHUB: Done!"
echo ""
echo "⚠️  IL RESTE: Ajouter CRON_SECRET dans Vercel"
echo "👉 Va sur: https://vercel.com/gennarros-projects/genx/settings/environment-variables"
echo "   Key: CRON_SECRET"
echo "   Value: VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw="
echo "   Target: Production + Preview + Development"
echo ""
echo "🎯 Après ça, l'autopilote sera actif dans 5 minutes!"
