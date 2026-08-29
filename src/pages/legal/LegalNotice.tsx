'use client';

import { Link } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { COMPANY } from '@/lib/company';

export function LegalNotice() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">Mentions légales</h1>

          <div className="space-y-10 text-muted-foreground leading-relaxed">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Éditeur du site</h2>
              <p>
                Le site et le service <strong className="text-foreground">{COMPANY.productName}</strong>{' '}
                sont édités par :
              </p>
              <p>
                <strong className="text-foreground">{COMPANY.tradeName}</strong>
                <br />
                Éditeur / Créateur : <strong className="text-foreground">{COMPANY.legalName}</strong>
                <br />
                Statut : <strong className="text-foreground">{COMPANY.legalForm}</strong>
                <br />
                Résidence : {COMPANY.region}, {COMPANY.country}
                <br />
                Adresse postale : <strong className="text-foreground">{COMPANY.city}, {COMPANY.country}</strong>
                <br />
                SIRET : {COMPANY.siret}
                <br />
                N° TVA intracommunautaire : <em>Non applicable (franchise en base de TVA)</em>
                <br />
                Directeur de la publication :{' '}
                <strong className="text-foreground">{COMPANY.legalName}</strong>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Hébergement</h2>
              <p>
                <strong className="text-foreground">{COMPANY.host.name}</strong>
                <br />
                {COMPANY.host.address}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Contact</h2>
              <p>
                Email :{' '}
                <a href={`mailto:${COMPANY.email}`} className="text-primary hover:underline">
                  {COMPANY.email}
                </a>
                <br />
                Téléphone : {COMPANY.phone}
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">Propriété intellectuelle</h2>
              <p>
                L’ensemble du contenu de ce site (textes, images, logos, etc.) est la propriété de{' '}
                {COMPANY.tradeName} / {COMPANY.legalName}. Toute reproduction, représentation ou
                diffusion, totale ou partielle, sans autorisation préalable, est interdite.
              </p>
            </section>

            <p className="text-sm pt-4 border-t">
              Voir aussi la{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                politique de confidentialité
              </Link>{' '}
              et les{' '}
              <Link to="/terms" className="text-primary hover:underline">
                conditions d’utilisation
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
