import type { KeywordResearch, LanguagePack } from './types';

function research(partial: KeywordResearch): KeywordResearch {
  return partial;
}

export const nlPack: LanguagePack = {
  language: 'nl',
  home: {
    localizedTitle: 'Pinterest Marketing Gidsen',
    metaTitle: 'Pinterest Marketing Gidsen - GenX',
    localizedMetaDescription:
      'Leer hoe je Pinterest kunt gebruiken om je bedrijf te laten groeien met onze complete gidsen over Pinterest marketing.',
    primaryKeyword: 'Pinterest marketing',
    secondaryKeywords: ['Pinterest voor bedrijven', 'Pinterest strategie', 'Pinterest marketing'],
    intro:
      'Ontdek hoe je Pinterest kunt gebruiken om je online bedrijf te laten groeien met onze praktische gidsen.',
    sections: [],
    faqs: [],
    research: research({
      secondaryKeywords: [],
      longTailKeywords: [],
      commercialKeywords: [],
      informationalQueries: [],
      questions: [],
      competitorPages: [],
      terminology: '',
    }),
  },
  hubs: [
    {
      category: 'business',
      localizedTitle: 'Pinterest voor Online Bedrijven',
      metaTitle: 'Pinterest Marketing voor Online Bedrijven - Complete Gids',
      localizedMetaDescription:
        'Complete gidsen om Pinterest te gebruiken om je online bedrijf te laten groeien, verkeer aan te trekken en verkopen te genereren.',
      primaryKeyword: 'Pinterest bedrijf',
      secondaryKeywords: ['Pinterest marketing', 'Pinterest business', 'Pinterest strategie'],
      intro:
        'Leer hoe je Pinterest kunt gebruiken om je online bedrijf te laten groeien met deze praktische gidsen.',
      sections: [],
      faqs: [],
      research: research({
        secondaryKeywords: [],
        longTailKeywords: [],
        commercialKeywords: [],
        informationalQueries: [],
        questions: [],
        competitorPages: [],
        terminology: '',
      }),
    },
  ],
  articles: [
    {
      contentId: 'amazon-affiliates-pinterest-marketing',
      localizedTitle: 'Pinterest Marketing voor Amazon Affiliates',
      metaTitle: 'Pinterest voor Amazon Affiliates: Complete Gids 2026',
      localizedMetaDescription:
        'Ontdek hoe je Pinterest kunt gebruiken om verkeer naar je Amazon affiliate links te genereren. Pin strategieën, openbaarmakingsvereisten en automatiseringstools.',
      intro:
        'Pinterest is een van de meest effectieve platforms voor Amazon affiliates om organisch verkeer te genereren zonder betaalde advertenties. Deze gids laat zien hoe je pins maakt die browsers omzetten in kopers, voldoet aan de openbaarmakingsvereisten van Amazon Associates en je Pinterest marketing strategie automatiseert met AI.',
      sections: [],
      faqs: [],
      sources: [],
      research: research({
        secondaryKeywords: [],
        longTailKeywords: [],
        commercialKeywords: [],
        informationalQueries: [],
        questions: [],
        competitorPages: [],
        terminology: '',
      }),
    },
    {
      contentId: 'bloggers-pinterest-marketing',
      localizedTitle: 'Pinterest Marketing voor Bloggers',
      metaTitle: 'Pinterest voor Bloggers: Verkeer naar je Blog 2026',
      localizedMetaDescription:
        'Leer hoe je Pinterest kunt gebruiken om consistent organisch verkeer naar je blog te genereren. Ontdek pin design, SEO strategieën en automatiseringstools voor bloggers.',
      intro:
        'Pinterest is een van de meest betrouwbare bronnen van gratis organisch verkeer voor bloggers. In tegenstelling tot sociale media waar posts na een paar uur verdwijnen, kunnen Pinterest pins maanden of zelfs jaren verkeer naar je artikelen genereren. Deze gids laat zien hoe je pins maakt die rangschikken in Pinterest zoekresultaten, je blog content optimaliseert voor Pinterest verkeer en je pinning workflow automatiseert.',
      sections: [],
      faqs: [],
      sources: [],
      research: research({
        secondaryKeywords: [],
        longTailKeywords: [],
        commercialKeywords: [],
        informationalQueries: [],
        questions: [],
        competitorPages: [],
        terminology: '',
      }),
    },
    {
      contentId: 'content-creators-pinterest-marketing',
      localizedTitle: 'Pinterest Marketing voor Content Creators',
      metaTitle: 'Pinterest voor Content Creators: Gids 2026',
      localizedMetaDescription:
        'Leer hoe content creators Pinterest kunnen gebruiken om hun publiek te laten groeien, verkeer naar hun platforms te genereren en hun content te monetizen.',
      intro:
        'Pinterest is een krachtig ontdekkingsplatform voor content creators uit alle niches. Of je nu video\'s, podcasts, digitale producten, cursussen of templates maakt, Pinterest kan je werk verbinden met een publiek dat actief op zoek is naar oplossingen. Deze gids laat zien hoe je Pinterest als content creator kunt inzetten om je bereik te vergroten, verkeer naar je platforms te genereren en kijkers om te zetten in klanten of abonnees.',
      sections: [],
      faqs: [],
      sources: [],
      research: research({
        secondaryKeywords: [],
        longTailKeywords: [],
        commercialKeywords: [],
        informationalQueries: [],
        questions: [],
        competitorPages: [],
        terminology: '',
      }),
    },
  ],
};
