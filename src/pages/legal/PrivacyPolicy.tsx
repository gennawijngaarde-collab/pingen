'use client';

import { Link } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { COMPANY } from '@/lib/company';

const LAST_UPDATED = '29 août 2026';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-neutral dark:prose-invert">
          <p className="text-sm text-muted-foreground not-prose mb-2">
            Dernière mise à jour : {LAST_UPDATED}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8 not-prose">
            Politique de confidentialité
          </h1>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Introduction</h2>
            <p>
              La présente politique de confidentialité a pour objectif de vous informer sur la
              manière dont <strong className="text-foreground">{COMPANY.tradeName}</strong>, éditeur
              du service <strong className="text-foreground">{COMPANY.productName}</strong>,
              collecte, utilise et protège les données personnelles que vous nous confiez dans le
              cadre de l’utilisation de notre site et de notre service d’automatisation Pinterest
              (création, planification et publication de Pins).
            </p>
            <p>
              {COMPANY.tradeName} s’engage à respecter votre vie privée et à protéger les
              informations personnelles que vous partagez avec nous, conformément au Règlement
              général sur la protection des données (RGPD) et aux lois applicables.
            </p>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">
              Responsable du traitement des données
            </h2>
            <p>Les données collectées sur le service sont traitées par :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-foreground">{COMPANY.tradeName}</strong> — éditeur de{' '}
                {COMPANY.productName} (automatisation Pinterest)
              </li>
              <li>
                Éditeur / responsable de publication :{' '}
                <strong className="text-foreground">{COMPANY.legalName}</strong> ({COMPANY.legalForm}
                )
              </li>
              <li>
                Adresse : {COMPANY.city}, {COMPANY.country}
              </li>
              <li>SIRET : {COMPANY.siret}</li>
              <li>
                Email :{' '}
                <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                  {COMPANY.privacyEmail}
                </a>
              </li>
              <li>
                Support :{' '}
                <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary hover:underline">
                  {COMPANY.supportEmail}
                </a>
              </li>
              <li>Téléphone : {COMPANY.phone}</li>
            </ul>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Données collectées</h2>
            <p>Nous collectons les informations suivantes lorsque vous utilisez PinGen :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Données de compte</strong> : nom, adresse e-mail,
                mot de passe (hashé), préférences de langue et paramètres de profil.
              </li>
              <li>
                <strong className="text-foreground">Données de navigation</strong> : adresse IP,
                type de navigateur, pages visitées, date et heure de visite (logs techniques
                nécessaires au bon fonctionnement).
              </li>
              <li>
                <strong className="text-foreground">Données liées au service</strong> : contenu des
                Pins (titres, descriptions, hashtags, images ou URLs), planning de publication,
                paramètres d’autopilote et informations de business que vous saisissez.
              </li>
              <li>
                <strong className="text-foreground">Connexion Pinterest</strong> : identifiants
                techniques OAuth (jetons d’accès / refresh), identifiant de compte Pinterest et
                listes de tableaux, uniquement pour publier en votre nom. Nous ne stockons jamais
                votre mot de passe Pinterest.
              </li>
              <li>
                <strong className="text-foreground">Paiement</strong> : en cas d’abonnement, les
                données de facturation sont traitées par Stripe, au nom de {COMPANY.tradeName}.{' '}
                {COMPANY.productName} ne conserve pas les numéros complets de carte bancaire.
              </li>
            </ul>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">
              Finalité de la collecte des données
            </h2>
            <p>Les données que nous collectons sont utilisées pour :</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Créer et gérer votre compte PinGen.</li>
              <li>
                Fournir le service : génération de contenu (le cas échéant via des prestataires
                d’IA), planification et publication de Pins sur Pinterest.
              </li>
              <li>Améliorer la qualité de nos services et votre expérience utilisateur.</li>
              <li>Répondre à vos questions et demandes via le support.</li>
              <li>Assurer la sécurité, la prévention des abus et le bon fonctionnement du site.</li>
              <li>
                Gérer la facturation et les abonnements, lorsque vous souscrivez à une offre payante.
              </li>
            </ol>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Base légale du traitement</h2>
            <p>Nous traitons vos données personnelles sur la base :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                de l’<strong className="text-foreground">exécution du contrat</strong> (fourniture
                du service PinGen auquel vous vous inscrivez) ;
              </li>
              <li>
                de notre <strong className="text-foreground">intérêt légitime</strong> à sécuriser et
                améliorer le service ;
              </li>
              <li>
                de votre <strong className="text-foreground">consentement</strong> pour certains
                traitements (cookies non essentiels, communications marketing le cas échéant) ;
              </li>
              <li>
                d’<strong className="text-foreground">obligations légales</strong> (comptabilité,
                réponses aux autorités compétentes).
              </li>
            </ul>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">
              Durée de conservation des données
            </h2>
            <p>
              Les données personnelles collectées sont conservées pour une durée qui ne saurait
              excéder celle nécessaire aux finalités pour lesquelles elles sont collectées :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Données de compte : pendant la durée de votre compte, puis suppression ou anonymisation sous un délai raisonnable après clôture.</li>
              <li>Logs techniques : durée limitée, nécessaire à la sécurité et au diagnostic.</li>
              <li>Données de facturation : selon les obligations légales comptables applicables.</li>
            </ul>
            <p>
              Au-delà de ces durées, les données sont supprimées ou anonymisées, sauf obligation
              légale de conservation plus longue.
            </p>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Partage des données</h2>
            <p>
              Les données personnelles collectées par {COMPANY.tradeName} via {COMPANY.productName}{' '}
              sont destinées à l’exploitation du service. Elles ne sont{' '}
              <strong className="text-foreground">jamais vendues</strong>.
            </p>
            <p>Elles peuvent être partagées uniquement avec :</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Pinterest</strong>, pour l’authentification OAuth
                et la publication de Pins selon vos instructions ;
              </li>
              <li>
                <strong className="text-foreground">Supabase</strong> (authentification et base de
                données), <strong className="text-foreground">Vercel</strong> (hébergement),{' '}
                <strong className="text-foreground">Stripe</strong> (paiements), et des prestataires
                d’IA (OpenRouter, Ideogram) agissant en tant que sous-traitants, liés par des
                obligations de confidentialité ;
              </li>
              <li>
                les autorités compétentes, uniquement en cas d’obligation légale ou de demande
                valide.
              </li>
            </ul>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Sécurité des données</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour
              protéger vos données contre toute altération, perte ou accès non autorisé
              (chiffrement des communications HTTPS, contrôle d’accès, secrets d’API côté serveur,
              etc.). Aucun système n’étant infaillible, nous vous invitons à utiliser un mot de
              passe robuste et unique.
            </p>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Vos droits</h2>
            <p>
              Conformément au RGPD et aux dispositions applicables, vous disposez des droits
              suivants concernant vos données personnelles :
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong className="text-foreground">Droit d’accès</strong> : obtenir la confirmation
                que vos données sont traitées et en recevoir une copie.
              </li>
              <li>
                <strong className="text-foreground">Droit de rectification</strong> : demander la
                correction de vos informations si elles sont inexactes ou incomplètes.
              </li>
              <li>
                <strong className="text-foreground">Droit d’opposition</strong> : vous opposer au
                traitement de vos données pour des raisons légitimes.
              </li>
              <li>
                <strong className="text-foreground">Droit à l’effacement</strong> : demander la
                suppression de vos données dans les conditions prévues par la loi.
              </li>
              <li>
                <strong className="text-foreground">Droit à la portabilité</strong> : recevoir vos
                données dans un format structuré, couramment utilisé et lisible par machine.
              </li>
              <li>
                <strong className="text-foreground">Droit de retirer votre consentement</strong> à
                tout moment pour les traitements fondés sur le consentement.
              </li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à{' '}
              <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                {COMPANY.privacyEmail}
              </a>
              . Vous pouvez également introduire une réclamation auprès de l’autorité de contrôle
              compétente (en France : la CNIL).
            </p>
          </section>

          <section id="cookies" className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Cookies et traceurs</h2>
            <p>
              Notre site peut utiliser des cookies et stockages locaux nécessaires au
              fonctionnement du service (session, préférences de langue, mode démo). Des cookies
              statistiques ou de mesure d’audience peuvent être utilisés pour améliorer le service.
              Vous pouvez gérer les préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">
              Modifications de la politique de confidentialité
            </h2>
            <p>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout
              moment. La date de mise à jour figurera en tête de page. Nous vous encourageons à la
              consulter régulièrement. En cas de changement substantiel, une information pourra être
              affichée dans l’application.
            </p>
          </section>

          <section className="space-y-4 text-muted-foreground leading-relaxed mb-10">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p>
              Pour toute question relative à cette politique de confidentialité ou à l’exercice de
              vos droits, veuillez nous contacter par e-mail à{' '}
              <a href={`mailto:${COMPANY.privacyEmail}`} className="text-primary hover:underline">
                {COMPANY.privacyEmail}
              </a>
              .
            </p>
          </section>

          <p className="not-prose text-sm text-muted-foreground pt-4 border-t">
            Voir aussi nos{' '}
            <Link to="/terms" className="text-primary hover:underline">
              conditions d’utilisation
            </Link>
            .
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}
