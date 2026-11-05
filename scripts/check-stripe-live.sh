#!/bin/bash
# ===================================
# Script de vérification Stripe Live
# ===================================

set -e

echo "🔍 Vérification de la configuration Stripe Live..."
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
CHECKS_PASSED=0
CHECKS_FAILED=0

# Fonction de vérification
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $1${NC}"
        ((CHECKS_FAILED++))
    fi
}

# 1. Vérifier que les variables d'environnement sont définies
echo "📋 Vérification des variables d'environnement..."
echo ""

if [ -f .env ]; then
    echo -e "${GREEN}✅ Fichier .env trouvé${NC}"
    
    # Vérifier STRIPE_SECRET_KEY
    if grep -q "^STRIPE_SECRET_KEY=sk_live_" .env; then
        echo -e "${GREEN}✅ STRIPE_SECRET_KEY en mode LIVE (sk_live_...)${NC}"
        ((CHECKS_PASSED++))
    elif grep -q "^STRIPE_SECRET_KEY=sk_test_" .env; then
        echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY en mode TEST (sk_test_...)${NC}"
        echo -e "${YELLOW}   Changez pour sk_live_... pour la production${NC}"
        ((CHECKS_FAILED++))
    else
        echo -e "${RED}❌ STRIPE_SECRET_KEY non configurée${NC}"
        ((CHECKS_FAILED++))
    fi
    
    # Vérifier VITE_STRIPE_PUBLISHABLE_KEY
    if grep -q "^VITE_STRIPE_PUBLISHABLE_KEY=pk_live_" .env; then
        echo -e "${GREEN}✅ VITE_STRIPE_PUBLISHABLE_KEY en mode LIVE (pk_live_...)${NC}"
        ((CHECKS_PASSED++))
    elif grep -q "^VITE_STRIPE_PUBLISHABLE_KEY=pk_test_" .env; then
        echo -e "${YELLOW}⚠️  VITE_STRIPE_PUBLISHABLE_KEY en mode TEST (pk_test_...)${NC}"
        echo -e "${YELLOW}   Changez pour pk_live_... pour la production${NC}"
        ((CHECKS_FAILED++))
    else
        echo -e "${RED}❌ VITE_STRIPE_PUBLISHABLE_KEY non configurée${NC}"
        ((CHECKS_FAILED++))
    fi
    
    # Vérifier STRIPE_PRICE_PRO
    if grep -q "^STRIPE_PRICE_PRO=price_" .env; then
        echo -e "${GREEN}✅ STRIPE_PRICE_PRO configuré${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ STRIPE_PRICE_PRO non configuré${NC}"
        echo -e "   Créez le produit Pro sur Stripe et ajoutez le Price ID${NC}"
        ((CHECKS_FAILED++))
    fi
    
    # Vérifier STRIPE_PRICE_BUSINESS
    if grep -q "^STRIPE_PRICE_BUSINESS=price_" .env; then
        echo -e "${GREEN}✅ STRIPE_PRICE_BUSINESS configuré${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ STRIPE_PRICE_BUSINESS non configuré${NC}"
        echo -e "   Créez le produit Business sur Stripe et ajoutez le Price ID${NC}"
        ((CHECKS_FAILED++))
    fi
    
else
    echo -e "${RED}❌ Fichier .env non trouvé${NC}"
    echo -e "${YELLOW}   Copiez .env.example vers .env et configurez vos clés${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 2. Vérifier la connexion à Stripe (si possible)
echo "🌐 Vérification de la connexion Stripe..."
echo ""

if command -v curl &> /dev/null && [ -f .env ]; then
    STRIPE_KEY=$(grep "^STRIPE_SECRET_KEY=" .env | cut -d '=' -f2)
    
    if [ ! -z "$STRIPE_KEY" ]; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
            -u "${STRIPE_KEY}:" \
            "https://api.stripe.com/v1/customers?limit=1")
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo -e "${GREEN}✅ Connexion Stripe réussie${NC}"
            ((CHECKS_PASSED++))
            
            # Vérifier le mode (test vs live)
            if [[ $STRIPE_KEY == sk_live_* ]]; then
                echo -e "${GREEN}✅ Mode LIVE confirmé${NC}"
                ((CHECKS_PASSED++))
            else
                echo -e "${YELLOW}⚠️  Mode TEST détecté${NC}"
                ((CHECKS_FAILED++))
            fi
        else
            echo -e "${RED}❌ Erreur de connexion Stripe (HTTP $HTTP_CODE)${NC}"
            echo -e "${YELLOW}   Vérifiez que votre clé API est valide${NC}"
            ((CHECKS_FAILED++))
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Impossible de vérifier la connexion (curl ou .env manquant)${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 3. Vérifier le fichier server/stripe.ts
echo "📝 Vérification du code..."
echo ""

if [ -f "server/stripe.ts" ]; then
    # Vérifier TRIAL_PERIOD_DAYS
    if grep -q "export const TRIAL_PERIOD_DAYS = 7" server/stripe.ts; then
        echo -e "${GREEN}✅ Essai gratuit configuré à 7 jours${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  TRIAL_PERIOD_DAYS différent de 7${NC}"
    fi
    
    # Vérifier productionRequiresLiveStripe
    if grep -q "pingenx.io" server/stripe.ts; then
        echo -e "${GREEN}✅ Validation des clés live pour pingenx.io activée${NC}"
        ((CHECKS_PASSED++))
    fi
else
    echo -e "${RED}❌ Fichier server/stripe.ts non trouvé${NC}"
    ((CHECKS_FAILED++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Résumé
echo "📊 RÉSUMÉ"
echo ""
echo -e "${GREEN}✅ Vérifications réussies : $CHECKS_PASSED${NC}"
echo -e "${RED}❌ Vérifications échouées : $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Tout est bon ! Votre app est prête pour Stripe Live !${NC}"
    echo ""
    echo "Prochaines étapes :"
    echo "1. Créez les produits Pro et Business sur Stripe Dashboard"
    echo "2. Ajoutez les Price IDs dans .env"
    echo "3. Déployez sur Vercel avec les bonnes variables d'env"
    echo "4. Testez le flux complet avec une vraie carte"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certaines vérifications ont échoué.${NC}"
    echo ""
    echo "Consultez STRIPE_LIVE_SETUP.md pour plus d'informations."
    exit 1
fi
