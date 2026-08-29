'use client';

import { Link } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { COMPANY } from '@/lib/company';

const LAST_UPDATED = '29 août 2026';

export function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted-foreground mb-2">
            Dernière mise à jour : {LAST_UPDATED}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
            Conditions d’utilisation
          </h1>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <p>
                Bienvenue sur <strong className="text-foreground">{COMPANY.productName}</strong>,
                édité par <strong className="text-foreground">{COMPANY.tradeName}</strong> (
                {COMPANY.legalName}, {COMPANY.legalForm}, SIRET {COMPANY.siret}). En utilisant notre
                site et notre service, vous acceptez les présentes conditions d’utilisation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">1. Objet du service</h2>
              <p>
                PinGen est une plateforme SaaS d’automatisation Pinterest permettant notamment de :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Générer des Pins (texte et, le cas échéant, images) assistés par IA ;</li>
                <li>Planifier et publier des Pins sur des comptes Pinterest connectés ;</li>
                <li>Utiliser l’autopilote et consulter des analytics de performance.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">2. Compte utilisateur</h2>
              <p>
                Vous vous engagez à fournir des informations exactes lors de l’inscription et à
                préserver la confidentialité de vos identifiants. Vous êtes responsable de toute
                activité réalisée via votre compte.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">3. Rôle de PinGen</h2>
              <p>PinGen fournit des outils d’automatisation. Nous :</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  ne garantissons pas les résultats marketing (impressions, ventes, croissance) ;
                </li>
                <li>
                  déclinons toute responsabilité en cas de suspension ou limitation de votre compte
                  Pinterest par Pinterest ;
                </li>
                <li>
                  agissons selon les autorisations OAuth que vous accordez à notre application
                  développeur Pinterest.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">4. Contenu et conformité</h2>
              <p>
                Vous êtes seul responsable du contenu des Pins (textes, images, liens) et de leur
                conformité aux règles de Pinterest, au droit d’auteur et aux lois applicables. Vous
                vous engagez à ne pas publier de contenu illégal, trompeur ou portant atteinte aux
                droits de tiers.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">5. Offres et tarifs</h2>
              <p>
                PinGen propose des offres gratuites et payantes décrites sur la page Tarifs. Les
                fonctionnalités et quotas peuvent évoluer. Les conditions tarifaires applicables
                sont celles affichées au moment de la souscription.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">6. Données personnelles</h2>
              <p>
                Le traitement de vos données est décrit dans notre{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">7. Modifications</h2>
              <p>
                PinGen se réserve le droit de modifier les présentes conditions à tout moment. Les
                utilisateurs seront informés des changements substantiels via le site ou
                l’application.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
              <p>
                Pour toute question :{' '}
                <a href={`mailto:${COMPANY.supportEmail}`} className="text-primary hover:underline">
                  {COMPANY.supportEmail}
                </a>
                . Éditeur : {COMPANY.tradeName} — {COMPANY.legalName}, {COMPANY.city}, {COMPANY.country}.
                .
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">9. Droit applicable</h2>
              <p>
                Les présentes conditions sont régies par le droit français. En cas de litige, et à
                défaut d’accord amiable, les tribunaux français compétents seront saisis.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
