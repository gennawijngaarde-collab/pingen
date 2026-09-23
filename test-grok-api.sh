#!/bin/bash

# Test direct de l'API Grok sur Vercel
echo "🧪 Test de l'API Grok sur production..."

curl -s "https://www.pingenx.io/api/ai/status" | jq '.'

echo ""
echo "Si hasImageAi = true, l'API Grok est bien configurée ✅"
echo "Si hasImageAi = false, il y a un problème avec la clé ❌"
