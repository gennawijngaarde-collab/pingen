import { COMPANY } from '../../../lib/company';
import { enPack } from './en';
import { PUBLISHED_GUIDE_LANGUAGES } from './languages';
import type { ArticleDraft, HubDraft, LanguagePack } from './types';

const PACKS: readonly LanguagePack[] = [enPack];

const ARTICLE_CATEGORY = {
  'etsy-pinterest-marketing': 'etsy',
  'shopify-pinterest-marketing': 'shopify',
  'business-pinterest-marketing': 'business',
} as const;

const ARTICLE_SLUG: Record<LanguagePack['language'], Record<string, string>> = {
  en: {
    'etsy-pinterest-marketing': 'pinterest-marketing',
    'shopify-pinterest-marketing': 'pinterest-marketing',
    'business-pinterest-marketing': 'pinterest-for-small-business',
  },
  fr: {},
  es: {},
  pt: {},
  nl: {},
};

const CATEGORY_SLUG: Record<LanguagePack['language'], Record<HubDraft['category'], string>> = {
  en: { etsy: 'etsy', shopify: 'shopify', business: 'online-business' },
  fr: { etsy: 'etsy', shopify: 'shopify', business: 'entreprise-en-ligne' },
  es: { etsy: 'etsy', shopify: 'shopify', business: 'negocio-online' },
  pt: { etsy: 'etsy', shopify: 'shopify', business: 'negocio-online' },
  nl: { etsy: 'etsy', shopify: 'shopify', business: 'online-ondernemen' },
};

const HREFLANG: Record<LanguagePack['language'], readonly string[]> = {
  en: ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU'],
  fr: ['fr', 'fr-FR', 'fr-BE', 'fr-CH', 'fr-CA'],
  es: ['es', 'es-ES', 'es-MX', 'es-CO', 'es-AR', 'es-CL', 'es-419'],
  pt: ['pt', 'pt-BR'],
  nl: ['nl', 'nl-NL', 'nl-BE'],
};

export const GUIDE_UI = {
  en: {
    onThisPage: 'On this page',
    related: 'Related guides',
    faq: 'Questions sellers ask',
    sources: 'Sources',
    updated: 'Updated',
    guides: 'Guides',
    breadcrumb: 'Breadcrumb',
  },
  fr: {
    onThisPage: 'Sur cette page',
    related: 'Guides liés',
    faq: 'Questions fréquentes',
    sources: 'Sources',
    updated: 'Mis à jour le',
    guides: 'Guides',
    breadcrumb: 'Fil d’Ariane',
  },
  es: {
    onThisPage: 'En esta página',
    related: 'Guías relacionadas',
    faq: 'Preguntas frecuentes',
    sources: 'Fuentes',
    updated: 'Actualizado el',
    guides: 'Guías',
    breadcrumb: 'Miga de pan',
  },
  pt: {
    onThisPage: 'Nesta página',
    related: 'Guias relacionados',
    faq: 'Perguntas frequentes',
    sources: 'Fontes',
    updated: 'Atualizado em',
    guides: 'Guias',
    breadcrumb: 'Trilha',
  },
  nl: {
    onThisPage: 'Op deze pagina',
    related: 'Gerelateerde gidsen',
    faq: 'Vragen van verkopers',
    sources: 'Bronnen',
    updated: 'Bijgewerkt op',
    guides: 'Gidsen',
    breadcrumb: 'Kruimelpad',
  },
} as const;

export interface GuideLink {
  href: string;
  title: string;
  hreflang: string;
}

export interface GuideMatch {
  pack: LanguagePack;
  kind: 'home' | 'hub' | 'article';
  path: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  intro: string;
  sections: LanguagePack['home']['sections'];
  faqs: LanguagePack['home']['faqs'];
  sources: ArticleDraft['sources'];
  hub?: HubDraft;
  article?: ArticleDraft;
}

function packHasCopy(pack: LanguagePack): boolean {
  return pack.articles.length > 0;
}

export function publishedPacks(): LanguagePack[] {
  const available = new Set<string>(PUBLISHED_GUIDE_LANGUAGES);
  return PACKS.filter((pack) => available.has(pack.language) && packHasCopy(pack));
}

export function categorySlug(language: LanguagePack['language'], category: HubDraft['category']): string {
  return CATEGORY_SLUG[language][category];
}

export function articleSlug(language: LanguagePack['language'], contentId: string): string {
  const slug = ARTICLE_SLUG[language][contentId];
  if (!slug) throw new Error(`Missing slug for ${language}/${contentId}`);
  return slug;
}

export function articleCategory(contentId: string): HubDraft['category'] {
  const category = ARTICLE_CATEGORY[contentId as keyof typeof ARTICLE_CATEGORY];
  if (!category) throw new Error(`Unknown guide ${contentId}`);
  return category;
}

export function homePath(language: LanguagePack['language']): string {
  return `/${language}`;
}

export function hubPath(language: LanguagePack['language'], category: HubDraft['category']): string {
  return `/${language}/${categorySlug(language, category)}`;
}

export function articlePath(language: LanguagePack['language'], contentId: string): string {
  return `${hubPath(language, articleCategory(contentId))}/${articleSlug(language, contentId)}`;
}

function normalize(pathname: string): string {
  const path = pathname.split('?')[0]?.split('#')[0] ?? '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

export function matchGuide(pathname: string): GuideMatch | null {
  const path = normalize(pathname);
  const parts = path.split('/').filter(Boolean);
  if (parts.length < 1 || parts.length > 3) return null;
  const language = parts[0];
  const pack = publishedPacks().find((item) => item.language === language);
  if (!pack) return null;

  if (parts.length === 1) {
    return {
      pack,
      kind: 'home',
      path: homePath(pack.language),
      title: pack.home.localizedTitle,
      metaTitle: pack.home.metaTitle,
      metaDescription: pack.home.localizedMetaDescription,
      primaryKeyword: pack.home.primaryKeyword,
      intro: pack.home.intro,
      sections: pack.home.sections,
      faqs: pack.home.faqs,
      sources: [],
    };
  }

  const hub = pack.hubs.find((item) => categorySlug(pack.language, item.category) === parts[1]);
  if (!hub) return null;

  if (parts.length === 2) {
    return {
      pack,
      kind: 'hub',
      path: hubPath(pack.language, hub.category),
      title: hub.localizedTitle,
      metaTitle: hub.metaTitle,
      metaDescription: hub.localizedMetaDescription,
      primaryKeyword: hub.primaryKeyword,
      intro: hub.intro,
      sections: hub.sections,
      faqs: hub.faqs,
      sources: [],
      hub,
    };
  }

  const article = pack.articles.find((item) => {
    return (
      articleCategory(item.contentId) === hub.category &&
      articleSlug(pack.language, item.contentId) === parts[2]
    );
  });
  if (!article) return null;

  return {
    pack,
    kind: 'article',
    path: articlePath(pack.language, article.contentId),
    title: article.localizedTitle,
    metaTitle: article.metaTitle,
    metaDescription: article.localizedMetaDescription,
      primaryKeyword: article.research.secondaryKeywords[0] ?? article.localizedTitle,
    intro: article.intro,
    sections: article.sections,
    faqs: article.faqs,
    sources: article.sources,
    hub,
    article,
  };
}

function groupKey(match: GuideMatch): string {
  if (match.kind === 'home') return 'home';
  if (match.kind === 'hub') return `hub:${match.hub?.category}`;
  return `article:${match.article?.contentId}`;
}

export function alternateLinks(match: GuideMatch): GuideLink[] {
  const key = groupKey(match);
  const links: GuideLink[] = [];
  for (const pack of publishedPacks()) {
    const candidate = matchGuide(homePath(pack.language));
    if (!candidate) continue;
    const same =
      pack.language === match.pack.language
        ? match
        : pack.articles.length === 0
          ? null
          : findEquivalent(pack, key);
    if (!same) continue;
    const href = `${COMPANY.siteUrl}${same.path}`;
    for (const code of HREFLANG[pack.language]) {
      links.push({ href, title: same.title, hreflang: code });
    }
    if (pack.language === 'en') {
      links.push({ href, title: same.title, hreflang: 'x-default' });
    }
  }
  return links;
}

function findEquivalent(pack: LanguagePack, key: string): GuideMatch | null {
  if (key === 'home') return matchGuide(homePath(pack.language));
  if (key.startsWith('hub:')) {
    const category = key.slice(4) as HubDraft['category'];
    return matchGuide(hubPath(pack.language, category));
  }
  const contentId = key.slice('article:'.length);
  if (!ARTICLE_SLUG[pack.language][contentId]) return null;
  return matchGuide(articlePath(pack.language, contentId));
}

const LANGUAGE_NAME = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  nl: 'Nederlands',
} as const;

export function languageChoices(match: GuideMatch): GuideLink[] {
  const key = groupKey(match);
  return publishedPacks().flatMap((pack) => {
    const same = pack.language === match.pack.language ? match : findEquivalent(pack, key);
    if (!same) return [];
    return [
      {
        href: same.path,
        title: LANGUAGE_NAME[pack.language],
        hreflang: pack.language,
      },
    ];
  });
}

export function relatedGuides(match: GuideMatch): GuideLink[] {
  return match.pack.articles
    .filter((article) => article.contentId !== match.article?.contentId)
    .map((article) => ({
      href: articlePath(match.pack.language, article.contentId),
      title: article.localizedTitle,
      hreflang: match.pack.language,
    }));
}

export function hubLinks(pack: LanguagePack): GuideLink[] {
  return pack.hubs.map((hub) => ({
    href: hubPath(pack.language, hub.category),
    title: hub.localizedTitle,
    hreflang: pack.language,
  }));
}

export function allGuidePaths(): string[] {
  const paths: string[] = [];
  for (const pack of publishedPacks()) {
    paths.push(homePath(pack.language));
    for (const hub of pack.hubs) paths.push(hubPath(pack.language, hub.category));
    for (const article of pack.articles) paths.push(articlePath(pack.language, article.contentId));
  }
  return paths;
}

/** Pages déjà publiées sur pingenx.io. Les guides s'ajoutent après, sans les retirer. */
const EXISTING_SITEMAP_ENTRIES = [
  { loc: `${COMPANY.siteUrl}/`, lastmod: '2026-11-08', changefreq: 'weekly', priority: '1.0' },
  { loc: `${COMPANY.siteUrl}/signup`, lastmod: '2026-10-10', changefreq: 'monthly', priority: '0.8' },
  { loc: `${COMPANY.siteUrl}/login`, lastmod: '2026-10-08', changefreq: 'yearly', priority: '0.3' },
  { loc: `${COMPANY.siteUrl}/privacy`, lastmod: '2026-10-28', changefreq: 'yearly', priority: '0.3' },
  { loc: `${COMPANY.siteUrl}/terms`, lastmod: '2026-10-28', changefreq: 'yearly', priority: '0.3' },
  { loc: `${COMPANY.siteUrl}/legal`, lastmod: '2026-10-28', changefreq: 'yearly', priority: '0.2' },
] as const;

export function sitemapXml(): string {
  const existingLocs = new Set<string>(EXISTING_SITEMAP_ENTRIES.map((entry) => entry.loc));
  const existing = EXISTING_SITEMAP_ENTRIES.map(
    (entry) =>
      `  <url>\n    <loc>${entry.loc}</loc>\n    <lastmod>${entry.lastmod}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority}</priority>\n  </url>`,
  );
  const guides = allGuidePaths()
    .filter((path) => !existingLocs.has(`${COMPANY.siteUrl}${path}`))
    .map((path) => {
      const match = matchGuide(path);
      const links = match ? alternateLinks(match) : [];
      const alternates = links
        .map(
          (link) =>
            `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${link.href}" />`,
        )
        .join('\n');
      const alternateBlock = alternates ? `\n${alternates}` : '';
      return `  <url>\n    <loc>${COMPANY.siteUrl}${path}</loc>${alternateBlock}\n  </url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${[...existing, ...guides].join('\n')}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\nDisallow: /coming-soon\nDisallow: /privacy.html\n\nSitemap: ${COMPANY.siteUrl}/sitemap.xml\n`;
}

export const GUIDE_UPDATED_AT = '2026-11-06';
