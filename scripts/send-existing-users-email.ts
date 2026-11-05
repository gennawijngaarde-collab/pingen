#!/usr/bin/env tsx
/**
 * Script pour envoyer l'email d'annonce d'essai gratuit aux utilisateurs existants
 * 
 * Usage :
 *   RESEND_API_KEY=re_... SUPABASE_SERVICE_ROLE_KEY=... npm run send-email
 */

import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || 'GenX <contact@pingenx.io>';

// Mode dry-run par défaut (pas d'envoi réel)
const DRY_RUN = process.env.DRY_RUN !== 'false';

function log(message: string, color: 'cyan' | 'green' | 'yellow' | 'red' = 'cyan') {
  const colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getEmailHtml(firstName: string): string {
  const name = firstName || 'cher utilisateur';
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #3B9EFF 0%, #7C3AED 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 32px; margin: 0;">
            GenX
        </h1>
    </div>
    
    <!-- Hero -->
    <div style="background: linear-gradient(135deg, #3B9EFF 0%, #7C3AED 100%); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">🎁 Profitez de 7 jours d'essai gratuit !</h2>
        <p style="margin: 0; font-size: 16px;">Plans Pro et Business - Toutes les fonctionnalités débloquées</p>
    </div>
    
    <!-- Content -->
    <div style="margin-bottom: 30px;">
        <p>Bonjour ${name},</p>
        
        <p>Nous avons une excellente nouvelle à vous annoncer ! 🎉</p>
        
        <p>GenX évolue et nous sommes ravis de vous offrir <strong>7 jours d'essai gratuit</strong> de nos plans Pro ou Business, avec toutes les fonctionnalités avancées :</p>
    </div>
    
    <!-- Plans -->
    <div style="margin-bottom: 30px;">
        <!-- Pro -->
        <div style="border: 2px solid #3B9EFF; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <h3 style="color: #3B9EFF; margin: 0 0 15px 0;">🚀 Plan Pro (19€/mois)</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Jusqu'à 150 pins par mois</li>
                <li>Génération d'images IA illimitée</li>
                <li>Génération de textes IA illimitée</li>
                <li>Programmation automatique</li>
                <li>Support prioritaire</li>
            </ul>
        </div>
        
        <!-- Business -->
        <div style="border: 2px solid #7C3AED; border-radius: 12px; padding: 20px;">
            <h3 style="color: #7C3AED; margin: 0 0 15px 0;">💼 Plan Business (49€/mois)</h3>
            <ul style="margin: 0; padding-left: 20px;">
                <li>Jusqu'à 600 pins par mois</li>
                <li>Tout ce qui est dans Pro +</li>
                <li>Mode Autopilot (100% automatique)</li>
                <li>Support dédié</li>
            </ul>
        </div>
    </div>
    
    <!-- Benefits -->
    <div style="background: #F7F7F7; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <h3 style="margin: 0 0 15px 0;">🎁 7 jours d'essai gratuit - Sans engagement</h3>
        <ul style="margin: 0; padding-left: 20px;">
            <li>Aucun paiement pendant 7 jours</li>
            <li>Annulez à tout moment</li>
            <li>Toutes les fonctionnalités débloquées</li>
        </ul>
    </div>
    
    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 30px;">
        <a href="https://www.pingenx.io/login" style="display: inline-block; background: linear-gradient(135deg, #3B9EFF 0%, #7C3AED 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Activer mon essai gratuit →
        </a>
    </div>
    
    <!-- Steps -->
    <div style="margin-bottom: 30px;">
        <h3>👉 Comment en profiter ?</h3>
        <ol style="padding-left: 20px;">
            <li>Connectez-vous à votre compte GenX</li>
            <li>Choisissez votre plan préféré</li>
            <li>Entrez vos coordonnées de carte (aucun prélèvement pendant 7 jours)</li>
            <li>Profitez de toutes les fonctionnalités !</li>
        </ol>
    </div>
    
    <!-- Footer -->
    <div style="border-top: 1px solid #E2E2E2; padding-top: 20px; margin-top: 30px; color: #717171; font-size: 14px;">
        <p>Si vous avez des questions, n'hésitez pas à nous répondre directement !</p>
        <p>À très bientôt,<br>L'équipe GenX</p>
        <p style="font-size: 12px; color: #9CA3AF; margin-top: 20px;">
            P.S. : Si vous ne souhaitez pas profiter de l'essai, vous pouvez continuer à utiliser GenX avec les fonctionnalités du plan Starter gratuitement.
        </p>
    </div>
    
</body>
</html>`;
}

async function sendEmail(to: string, firstName: string): Promise<boolean> {
  if (DRY_RUN) {
    log(`  [DRY RUN] Envoi vers ${to} (${firstName})`, 'yellow');
    return true;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [to],
      subject: '🎁 Profitez de 7 jours d\'essai gratuit GenX Pro/Business !',
      html: getEmailHtml(firstName),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`  [ERREUR] ${to}: ${error}`);
    return false;
  }

  return true;
}

async function main() {
  log('\n🚀 Envoi des emails aux utilisateurs existants\n', 'cyan');

  // Vérifications
  if (!RESEND_API_KEY) {
    log('❌ ERREUR : RESEND_API_KEY non définie', 'red');
    log('Usage : RESEND_API_KEY=re_... npm run send-email\n', 'yellow');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    log('❌ ERREUR : Variables Supabase non définies', 'red');
    log('Définissez VITE_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY\n', 'yellow');
    process.exit(1);
  }

  if (DRY_RUN) {
    log('⚠️  MODE DRY RUN activé (aucun email ne sera envoyé)', 'yellow');
    log('   Pour envoyer réellement : DRY_RUN=false npm run send-email\n', 'yellow');
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Récupérer les utilisateurs avec plan 'starter' (utilisateurs existants qui n'ont pas encore migré)
  log('📊 Récupération des utilisateurs éligibles...', 'cyan');
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('email, full_name, created_at')
    .eq('plan', 'starter')
    .not('email', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    log(`❌ Erreur : ${error.message}`, 'red');
    process.exit(1);
  }

  if (!users || users.length === 0) {
    log('ℹ️  Aucun utilisateur éligible trouvé', 'yellow');
    process.exit(0);
  }

  log(`✅ ${users.length} utilisateurs trouvés\n`, 'green');

  // Statistiques
  let sent = 0;
  let failed = 0;

  // Envoi des emails
  for (const user of users) {
    const firstName = user.full_name?.split(' ')[0] || '';
    
    try {
      const success = await sendEmail(user.email, firstName);
      if (success) {
        sent++;
        if (!DRY_RUN) {
          log(`  ✅ ${user.email}`, 'green');
        }
      } else {
        failed++;
      }
      
      // Pause de 100ms entre chaque email pour éviter les rate limits
      if (!DRY_RUN) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      failed++;
      log(`  ❌ ${user.email}: ${error}`, 'red');
    }
  }

  // Résumé
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`📊 Résumé ${DRY_RUN ? '(DRY RUN)' : ''}`, 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  log(`Total : ${users.length} utilisateurs`, 'cyan');
  log(`✅ Envoyés : ${sent}`, 'green');
  if (failed > 0) {
    log(`❌ Échecs : ${failed}`, 'red');
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan');

  if (DRY_RUN) {
    log('💡 Pour envoyer réellement les emails :', 'yellow');
    log('   DRY_RUN=false RESEND_API_KEY=re_... npm run send-email\n', 'yellow');
  }
}

main().catch(console.error);
