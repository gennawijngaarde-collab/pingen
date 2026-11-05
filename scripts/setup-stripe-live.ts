#!/usr/bin/env tsx
/**
 * Script d'automatisation Stripe Live
 * 
 * Ce script :
 * 1. Crée les produits Pro et Business sur Stripe
 * 2. Configure les prix avec essai gratuit de 7 jours
 * 3. Crée le webhook automatiquement
 * 4. Affiche les variables d'environnement à configurer sur Vercel
 * 
 * Usage :
 *   STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe
 */

import Stripe from 'stripe';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof COLORS = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function main() {
  log('\n🚀 Configuration automatique de Stripe Live\n', 'cyan');

  // 1. Vérifier la clé Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeKey) {
    log('❌ ERREUR : STRIPE_SECRET_KEY non définie', 'red');
    log('\nUsage :', 'yellow');
    log('  STRIPE_SECRET_KEY=sk_live_... npm run setup-stripe\n', 'yellow');
    log('Récupérez votre clé sur : https://dashboard.stripe.com/apikeys\n', 'cyan');
    process.exit(1);
  }

  // Vérifier que c'est une clé Live
  const isLive = stripeKey.startsWith('sk_live_');
  const isTest = stripeKey.startsWith('sk_test_');

  if (isTest) {
    log('⚠️  ATTENTION : Vous utilisez une clé TEST (sk_test_...)', 'yellow');
    log('   Pour la production, utilisez une clé LIVE (sk_live_...)\n', 'yellow');
  } else if (isLive) {
    log('✅ Clé Stripe LIVE détectée\n', 'green');
  } else {
    log('❌ ERREUR : Clé Stripe invalide', 'red');
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-09-30.endive' as any,
  });

  log('📦 Étape 1/4 : Création du produit Pro...', 'blue');
  
  try {
    // Créer le produit Pro
    const proProd = await stripe.products.create({
      name: 'GenX Pro',
      description: 'Plan Pro - 150 pins/mois + génération automatique d\'images et textes IA',
      metadata: {
        plan: 'pro',
      },
    });
    log(`✅ Produit Pro créé : ${proProd.id}`, 'green');

    // Créer le prix Pro avec essai de 7 jours
    const proPrice = await stripe.prices.create({
      product: proProd.id,
      currency: 'eur',
      unit_amount: 1900, // 19.00 EUR
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
      metadata: {
        plan: 'pro',
      },
    });
    log(`✅ Prix Pro créé : ${proPrice.id} (19€/mois, essai 7 jours)\n`, 'green');

    log('📦 Étape 2/4 : Création du produit Business...', 'blue');

    // Créer le produit Business
    const businessProd = await stripe.products.create({
      name: 'GenX Business',
      description: 'Plan Business - 600 pins/mois + autopilot automatique + support dédié',
      metadata: {
        plan: 'business',
      },
    });
    log(`✅ Produit Business créé : ${businessProd.id}`, 'green');

    // Créer le prix Business avec essai de 7 jours
    const businessPrice = await stripe.prices.create({
      product: businessProd.id,
      currency: 'eur',
      unit_amount: 4900, // 49.00 EUR
      recurring: {
        interval: 'month',
        trial_period_days: 7,
      },
      metadata: {
        plan: 'business',
      },
    });
    log(`✅ Prix Business créé : ${businessPrice.id} (49€/mois, essai 7 jours)\n`, 'green');

    log('🔗 Étape 3/4 : Configuration du webhook...', 'blue');

    const webhookUrl = 'https://www.pingenx.io/api/stripe/webhook';
    const webhookEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.paid',
      'invoice.payment_failed',
    ] as const;

    // Vérifier si le webhook existe déjà
    const existingWebhooks = await stripe.webhookEndpoints.list({
      limit: 100,
    });

    const existingWebhook = existingWebhooks.data.find(
      (wh) => wh.url === webhookUrl && wh.status === 'enabled'
    );

    let webhookSecret: string;

    if (existingWebhook) {
      log(`✅ Webhook déjà existant : ${existingWebhook.id}`, 'green');
      webhookSecret = existingWebhook.secret || 'whsec_...';
      log(`   URL : ${webhookUrl}`, 'cyan');
    } else {
      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: webhookEvents as any,
        description: 'GenX billing sync (auto-provisioned)',
      });
      log(`✅ Webhook créé : ${webhook.id}`, 'green');
      log(`   URL : ${webhookUrl}`, 'cyan');
      webhookSecret = webhook.secret;
    }

    log('\n🎉 Configuration terminée avec succès !\n', 'green');

    // Récupérer la clé publique
    log('📋 Étape 4/4 : Variables d\'environnement à configurer\n', 'blue');
    
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('COPIEZ CES VARIABLES DANS VERCEL (Environment Variables)', 'yellow');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    const publishableKey = stripeKey.replace('sk_', 'pk_');
    
    log('# Stripe Live Keys');
    log(`STRIPE_SECRET_KEY=${stripeKey}`);
    log(`VITE_STRIPE_PUBLISHABLE_KEY=${publishableKey}`);
    log('');
    log('# Stripe Price IDs (créés par ce script)');
    log(`STRIPE_PRICE_PRO=${proPrice.id}`);
    log(`STRIPE_PRICE_BUSINESS=${businessPrice.id}`);
    log('');
    log('# Webhook Secret (optionnel mais recommandé)');
    log(`STRIPE_WEBHOOK_SECRET=${webhookSecret}`);

    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

    log('🔧 Prochaines étapes :\n', 'yellow');
    log('1. Allez sur https://vercel.com/dashboard', 'cyan');
    log('2. Sélectionnez le projet "pingen"', 'cyan');
    log('3. Settings → Environment Variables', 'cyan');
    log('4. Ajoutez les variables ci-dessus (Environment: Production)', 'cyan');
    log('5. Redéployez l\'application (Deployments → Redeploy)', 'cyan');
    log('6. Testez sur https://www.pingenx.io/signup\n', 'cyan');

    log('✨ Configuration Stripe Live terminée !\n', 'green');

    // Sauvegarder dans un fichier .env.stripe
    const envContent = `# Généré automatiquement par setup-stripe-live.ts
# Date : ${new Date().toISOString()}

# Stripe Live Keys
STRIPE_SECRET_KEY=${stripeKey}
VITE_STRIPE_PUBLISHABLE_KEY=${publishableKey}

# Stripe Price IDs
STRIPE_PRICE_PRO=${proPrice.id}
STRIPE_PRICE_BUSINESS=${businessPrice.id}

# Webhook Secret
STRIPE_WEBHOOK_SECRET=${webhookSecret}
`;

    const fs = await import('fs/promises');
    await fs.writeFile('.env.stripe', envContent);
    log('💾 Variables sauvegardées dans .env.stripe', 'green');
    log('   ⚠️  Ne commitez PAS ce fichier dans Git !\n', 'yellow');

  } catch (error) {
    log('\n❌ ERREUR lors de la configuration Stripe', 'red');
    if (error instanceof Error) {
      log(`   ${error.message}`, 'red');
    }
    log('\nConsultez https://dashboard.stripe.com pour plus de détails\n', 'cyan');
    process.exit(1);
  }
}

main().catch((error) => {
  log('\n❌ Erreur fatale', 'red');
  console.error(error);
  process.exit(1);
});
