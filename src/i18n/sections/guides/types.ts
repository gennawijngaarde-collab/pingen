export interface SeoTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface SeoSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  steps?: string[];
  table?: SeoTable;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoSource {
  label: string;
  url: string;
}

export interface KeywordResearch {
  secondaryKeywords: string[];
  longTailKeywords: string[];
  commercialKeywords: string[];
  informationalQueries: string[];
  questions: string[];
  competitorPages: SeoSource[];
  terminology: string;
}

export interface HomeDraft {
  localizedTitle: string;
  metaTitle: string;
  localizedMetaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  research: KeywordResearch;
}

export interface HubDraft {
  category: 'etsy' | 'shopify' | 'business';
  localizedTitle: string;
  metaTitle: string;
  localizedMetaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  research: KeywordResearch;
}

export interface ArticleDraft {
  contentId: string;
  localizedTitle: string;
  metaTitle: string;
  localizedMetaDescription: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  sources: SeoSource[];
  research: KeywordResearch;
}

/** Same shape as the other i18n sections: one object per language, no second store. */
export interface LanguagePack {
  language: 'en' | 'fr' | 'es' | 'pt' | 'nl';
  home: HomeDraft;
  hubs: HubDraft[];
  articles: ArticleDraft[];
}
