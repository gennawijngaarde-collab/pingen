import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { isAppLocale } from '@/i18n/current';
import { useI18n } from '@/i18n/I18nProvider';
import {
  GUIDE_UI,
  GUIDE_UPDATED_AT,
  alternateLinks,
  hubLinks,
  languageChoices,
  matchGuide,
  relatedGuides,
  type GuideMatch,
} from '@/i18n/sections/guides';
import { COMPANY } from '@/lib/company';
import { NotFound } from '@/pages/NotFound';

const HTML_LANG: Record<GuideMatch['pack']['language'], string> = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  pt: 'pt-BR',
  nl: 'nl',
};

function absolute(path: string): string {
  return `${COMPANY.siteUrl}${path}`;
}

function imageFor(match: GuideMatch): string {
  const category = match.hub?.category ?? (match.kind === 'home' ? null : null);
  if (category === 'etsy') return '/examples/etsy.jpg';
  if (category === 'shopify') return '/examples/shopify.jpg';
  if (category === 'business') return '/examples/blog.jpg';
  return '/examples/traffic.jpg';
}

function useGuideHead(match: GuideMatch) {
  const path = match.path;

  useEffect(() => {
    const current = matchGuide(path);
    if (!current) return;

    const canonical = absolute(current.path);
    const image = absolute(imageFor(current));
    const htmlLang = HTML_LANG[current.pack.language];
    const previousTitle = document.title;
    const previousLang = document.documentElement.lang;
    const description = document.querySelector('meta[name="description"]');
    const previousDescription = description?.getAttribute('content') ?? '';
    document.title = current.metaTitle;
    document.documentElement.lang = htmlLang;
    description?.setAttribute('content', current.metaDescription);

    const created: HTMLElement[] = [];
    const canonicalLink = document.createElement('link');
    canonicalLink.rel = 'canonical';
    canonicalLink.href = canonical;
    document.head.append(canonicalLink);
    created.push(canonicalLink);

    for (const link of alternateLinks(current)) {
      const el = document.createElement('link');
      el.rel = 'alternate';
      el.hreflang = link.hreflang;
      el.href = link.href;
      document.head.append(el);
      created.push(el);
    }

    const restorers: Array<() => void> = [];
    const setProperty = (property: string, value: string) => {
      const el = document.querySelector(`meta[property="${property}"]`);
      if (!el) return;
      const previous = el.getAttribute('content');
      el.setAttribute('content', value);
      restorers.push(() => {
        if (previous != null) el.setAttribute('content', previous);
      });
    };
    const setName = (name: string, value: string) => {
      const el = document.querySelector(`meta[name="${name}"]`);
      if (!el) return;
      const previous = el.getAttribute('content');
      el.setAttribute('content', value);
      restorers.push(() => {
        if (previous != null) el.setAttribute('content', previous);
      });
    };
    setProperty('og:title', current.metaTitle);
    setProperty('og:description', current.metaDescription);
    setProperty('og:url', canonical);
    setProperty('og:image', image);
    setName('twitter:title', current.metaTitle);
    setName('twitter:description', current.metaDescription);
    setName('twitter:image', image);

    return () => {
      document.title = previousTitle;
      document.documentElement.lang = previousLang;
      description?.setAttribute('content', previousDescription);
      for (const el of created) el.remove();
      for (const restore of restorers) restore();
    };
  }, [path]);
}

function structuredData(match: GuideMatch): string {
  const url = absolute(match.path);
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      url,
      name: match.metaTitle,
      description: match.metaDescription,
      inLanguage: HTML_LANG[match.pack.language],
      dateModified: GUIDE_UPDATED_AT,
      isPartOf: { '@type': 'WebSite', name: 'PingenX', url: COMPANY.siteUrl },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: crumbs(match).map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.href),
      })),
    },
  ];
  if (match.faqs.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: match.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function crumbs(match: GuideMatch): { name: string; href: string }[] {
  const ui = GUIDE_UI[match.pack.language];
  const items = [
    { name: 'PingenX', href: '/' },
    { name: ui.guides, href: `/${match.pack.language}` },
  ];
  if (match.kind === 'home') return items;
  if (match.kind === 'article' && match.hub) {
    const href = hubLinks(match.pack).find((link) => link.title === match.hub?.localizedTitle)?.href;
    items.push({ name: match.hub.localizedTitle, href: href ?? `/${match.pack.language}` });
  }
  items.push({ name: match.title, href: match.path });
  return items;
}

export function GuidePage() {
  const { pathname } = useLocation();
  const match = matchGuide(pathname);
  if (!match) return <NotFound />;
  return <GuideDocument match={match} />;
}

function GuideDocument({ match }: { match: GuideMatch }) {
  const { setLocale } = useI18n();
  const ui = GUIDE_UI[match.pack.language];
  const updated = new Intl.DateTimeFormat(HTML_LANG[match.pack.language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${GUIDE_UPDATED_AT}T00:00:00Z`));

  useEffect(() => {
    if (isAppLocale(match.pack.language)) setLocale(match.pack.language);
  }, [match.pack.language, setLocale]);

  useGuideHead(match);

  const trail = crumbs(match);
  const languages = languageChoices(match);
  const related = relatedGuides(match);
  const sections = hubLinks(match.pack);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-28 pb-20">
        <article className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav aria-label={ui.breadcrumb} className="text-sm text-muted-foreground mb-6">
            <ol className="flex flex-wrap gap-x-2 gap-y-1">
              {trail.map((crumb, index) => {
                const last = index === trail.length - 1;
                return (
                  <li key={crumb.href + crumb.name} className="flex gap-2">
                    {last ? (
                      <span aria-current="page">{crumb.name}</span>
                    ) : (
                      <Link to={crumb.href} className="hover:text-primary">
                        {crumb.name}
                      </Link>
                    )}
                    {!last && <span aria-hidden="true">/</span>}
                  </li>
                );
              })}
            </ol>
          </nav>

          <header className="mb-8">
            <p className="text-sm font-medium text-primary mb-3">{match.primaryKeyword}</p>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground mb-4">
              {match.title}
            </h1>
            <p className="text-sm text-muted-foreground mb-6">
              <time dateTime={GUIDE_UPDATED_AT}>
                {ui.updated} {updated}
              </time>
            </p>
            <p className="text-lg text-muted-foreground">{match.intro}</p>
          </header>

          {languages.length > 1 && (
            <nav aria-label={ui.guides} className="mb-8">
              <ul className="flex flex-wrap gap-3 text-sm">
                {languages.map((language) => (
                  <li key={language.hreflang}>
                    <Link
                      to={language.href}
                      hrefLang={language.hreflang}
                      lang={language.hreflang}
                      className="underline-offset-4 hover:underline"
                      aria-current={language.href === match.path ? 'page' : undefined}
                    >
                      {language.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <nav aria-label={ui.onThisPage} className="mb-10 rounded-2xl border bg-muted/30 p-6">
            <p className="font-semibold mb-3">{ui.onThisPage}</p>
            <ol className="list-decimal pl-5 space-y-2">
              {match.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="hover:text-primary">
                    {section.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-10">
            {match.sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`}>
                <h2 id={`${section.id}-title`} className="text-2xl font-bold mb-4">
                  {section.heading}
                </h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="text-muted-foreground leading-relaxed mb-4">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground mb-4">
                    {section.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
                {section.steps && (
                  <ol className="list-decimal pl-5 space-y-2 text-muted-foreground mb-4">
                    {section.steps.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                )}
                {section.table && (
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-sm border-collapse">
                      <caption className="text-left font-semibold mb-2">{section.table.caption}</caption>
                      <thead>
                        <tr>
                          {section.table.headers.map((header) => (
                            <th key={header} scope="col" className="border-b p-2 text-left">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row) => (
                          <tr key={row.join('|')}>
                            {row.map((cell) => (
                              <td key={cell} className="border-b p-2 align-top text-muted-foreground">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}
          </div>

          {match.faqs.length > 0 && (
            <section className="mt-12" aria-labelledby="guide-faq">
              <h2 id="guide-faq" className="text-2xl font-bold mb-4">
                {ui.faq}
              </h2>
              <Accordion type="single" collapsible className="space-y-3">
                {match.faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`} className="border rounded-xl px-4">
                    <AccordionTrigger className="text-left font-semibold hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}

          {match.sources.length > 0 && (
            <section className="mt-12" aria-labelledby="guide-sources">
              <h2 id="guide-sources" className="text-2xl font-bold mb-4">
                {ui.sources}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                {match.sources.map((source) => (
                  <li key={source.url}>
                    <a href={source.url} rel="noopener noreferrer" className="hover:text-primary">
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(related.length > 0 || sections.length > 0) && (
            <aside className="mt-12 rounded-2xl border bg-muted/30 p-6" aria-labelledby="guide-related">
              <h2 id="guide-related" className="text-xl font-bold mb-4">
                {ui.related}
              </h2>
              <ul className="space-y-2">
                {sections.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="hover:text-primary">
                      {link.title}
                    </Link>
                  </li>
                ))}
                {related.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="hover:text-primary">
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </article>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(match) }} />
    </div>
  );
}
