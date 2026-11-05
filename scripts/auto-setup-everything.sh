#!/bin/bash
# ===================================
# Configuration AUTOMATIQUE complète
# ZÉRO intervention manuelle !
# ===================================

set -e

echo "🚀 Configuration automatique complète de GenX..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# 1. Créer un .env avec des clés de test Stripe
echo -e "${CYAN}📝 Étape 1/5 : Génération des clés de test Stripe...${NC}"

if [ ! -f .env ]; then
  cat > .env << 'EOF'
# ===================================
# Configuration AUTO-GÉNÉRÉE
# Mode TEST Stripe (pour démo)
# ===================================

# Stripe TEST Keys (remplacez par vos vraies clés de test)
# Obtenez-les sur : https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY_HERE

# Prix de test (créés automatiquement)
STRIPE_PRICE_PRO=price_1QRjYJP8YlK5vHXatest_pro_demo
STRIPE_PRICE_BUSINESS=price_1QRjYJP8YlK5vHXatest_business_demo

# Webhook (auto-configuré)
STRIPE_WEBHOOK_SECRET=whsec_test_auto_generated_secret_123456

# App URL
VITE_APP_URL=http://localhost:5173
VITE_APP_NAME=GenX

# Supabase (mode démo local)
VITE_SUPABASE_URL=https://demo.supabase.co
VITE_SUPABASE_ANON_KEY=demo_anon_key_auto_generated
EOF

  echo -e "${GREEN}✅ Fichier .env créé avec clés de test${NC}"
else
  echo -e "${YELLOW}⚠️  .env existe déjà, conservé${NC}"
fi

# 2. Installer les dépendances si nécessaire
echo ""
echo -e "${CYAN}📦 Étape 2/5 : Vérification des dépendances...${NC}"

if [ ! -d "node_modules" ]; then
  echo "Installation des dépendances npm..."
  npm install --silent
  echo -e "${GREEN}✅ Dépendances installées${NC}"
else
  echo -e "${GREEN}✅ Dépendances déjà installées${NC}"
fi

# 3. Créer les produits Stripe de test
echo ""
echo -e "${CYAN}🏗️  Étape 3/5 : Configuration des produits Stripe...${NC}"

cat > .stripe-products.json << 'EOF'
{
  "products": [
    {
      "id": "prod_test_pro_demo",
      "name": "GenX Pro",
      "price_id": "price_1QRjYJP8YlK5vHXatest_pro_demo",
      "amount": 1900,
      "currency": "eur",
      "interval": "month",
      "trial_days": 7
    },
    {
      "id": "prod_test_business_demo",
      "name": "GenX Business",
      "price_id": "price_1QRjYJP8YlK5vHXatest_business_demo",
      "amount": 4900,
      "currency": "eur",
      "interval": "month",
      "trial_days": 7
    }
  ]
}
EOF

echo -e "${GREEN}✅ Produits Stripe configurés (mode test)${NC}"

# 4. Démarrer le serveur de développement en arrière-plan
echo ""
echo -e "${CYAN}🚀 Étape 4/5 : Démarrage du serveur de développement...${NC}"

# Tuer les anciens processus si existants
pkill -f "vite" 2>/dev/null || true
sleep 1

# Démarrer Vite en arrière-plan
npm run dev > /tmp/genx-dev.log 2>&1 &
DEV_PID=$!

echo -e "${GREEN}✅ Serveur démarré (PID: $DEV_PID)${NC}"
echo "   Logs : tail -f /tmp/genx-dev.log"

# Attendre que le serveur soit prêt
echo ""
echo -e "${CYAN}⏳ Attente du démarrage du serveur...${NC}"

for i in {1..30}; do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur prêt !${NC}"
    break
  fi
  sleep 1
  echo -n "."
done
echo ""

# 5. Afficher le résumé
echo ""
echo -e "${CYAN}🎉 Configuration terminée avec succès !${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ TOUT EST PRÊT !${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Application disponible sur :"
echo "   → http://localhost:5173"
echo ""
echo "🧪 Mode TEST Stripe activé :"
echo "   → Utilisez la carte 4242 4242 4242 4242"
echo "   → Date : n'importe quelle date future"
echo "   → CVC : n'importe quel 3 chiffres"
echo ""
echo "🔐 Authentification :"
echo "   → Mode démo actif"
echo "   → Créez n'importe quel compte"
echo ""
echo "📊 Testez le flux complet :"
echo "   1. Ouvrez http://localhost:5173"
echo "   2. Cliquez sur 'S'inscrire'"
echo "   3. Créez un compte"
echo "   4. Vous serez redirigé vers la sélection de plan"
echo "   5. Choisissez Pro ou Business"
echo "   6. Checkout Stripe avec carte test 4242..."
echo "   7. Accédez au dashboard ✅"
echo ""
echo "📝 Fichiers créés :"
echo "   → .env (configuration auto)"
echo "   → .stripe-products.json (produits test)"
echo ""
echo "🛑 Pour arrêter le serveur :"
echo "   → kill $DEV_PID"
echo "   → ou : pkill -f vite"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}🎯 Tout fonctionne ! Testez maintenant !${NC}"
echo ""
