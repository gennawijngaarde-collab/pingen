'use client';

import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { COMPANY } from '@/lib/company';
import { HOME_HASH, ROUTES } from '@/lib/routes';

export function Footer() {
  const { t } = useI18n();
  const l = t.footer.links;

  const columns = [
    {
      title: t.footer.product,
      links: [
        { label: l.features, href: HOME_HASH.features },
        { label: l.pricing, href: HOME_HASH.pricing },
        { label: l.templates, href: ROUTES.comingSoon },
        { label: l.integrations, href: ROUTES.comingSoon },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: l.about, href: ROUTES.legal },
        { label: l.blog, href: ROUTES.comingSoon },
        { label: l.careers, href: ROUTES.comingSoon },
        { label: l.contact, href: `mailto:${COMPANY.email}` },
      ],
    },
    {
      title: t.footer.resources,
      links: [
        { label: l.docs, href: ROUTES.comingSoon },
        { label: l.tutorials, href: ROUTES.comingSoon },
        { label: l.help, href: ROUTES.comingSoon },
        { label: l.community, href: ROUTES.comingSoon },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: l.privacy, href: ROUTES.privacy },
        { label: l.terms, href: ROUTES.terms },
        { label: l.cookies, href: ROUTES.privacyCookies },
        { label: l.legalNotice, href: ROUTES.legal },
      ],
    },
  ];

  return (
    <footer className="bg-muted/30 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link to={ROUTES.home} className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <span className="font-bold text-2xl text-foreground">{COMPANY.productName}</span>
              </Link>

              <p className="text-muted-foreground mb-6 max-w-sm">{t.footer.tagline}</p>
            </div>

            {columns.map((column) => (
              <div key={column.title}>
                <h4 className="font-semibold text-foreground mb-4">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('mailto:') ? (
                        <a
                          href={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          to={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="py-6 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {COMPANY.tradeName}. {t.footer.rights}
            </p>
            <div className="flex items-center gap-6">
              <Link
                to={ROUTES.privacy}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {l.privacy}
              </Link>
              <Link
                to={ROUTES.terms}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {l.terms}
              </Link>
              <Link
                to={ROUTES.privacyCookies}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {l.cookies}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
