#!/bin/bash
# GenX SaaS - Configuration Autopilote

echo "🚀 Configuration de l'autopilote GenX..."
echo ""

CRON_SECRET="VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw="

echo "📝 Ajout du secret CRON_SECRET dans GitHub..."
echo "$CRON_SECRET" | gh secret set CRON_SECRET --repo gennawijngaarde-collab/pingen

if [ $? -eq 0 ]; then
  echo "✅ Secret GitHub configuré!"
  echo ""
  echo "⚠️  IL RESTE: Ajouter dans Vercel"
  echo "👉 https://vercel.com/gennarros-projects/genx/settings/environment-variables"
  echo "   Key: CRON_SECRET"
  echo "   Value: VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw="
else
  echo "❌ Erreur. Configure manuellement:"
  echo "👉 https://github.com/gennawijngaarde-collab/pingen/settings/secrets/actions"
fi
