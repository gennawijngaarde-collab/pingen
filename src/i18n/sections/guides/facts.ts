/**
 * Product facts taken from the running app (quota.ts, pricing UI, publisher).
 * Landing pages must use these numbers and must not invent plan limits.
 */
export const PRODUCT = {
  publicName: 'PingenX',
  appLabel: 'GenX',
  siteUrl: 'https://www.pingenx.io',
  contactEmail: 'contact@pingenx.io',
  trialDays: 7,
  titleMaxChars: 100,
  descriptionMaxChars: 800,
  altTextMaxChars: 500,
  duplicateTitleThreshold: 0.7,
  autopilotLookAheadDays: 14,
  /** UI and AI pin copy. Portuguese and Dutch are not in this list. */
  uiLanguages: ['English', 'French', 'Spanish', 'German'] as const,
  plans: {
    starter: { priceEur: 0, pins: 5, aiImages: 5, aiTexts: 20, autopilotPerDay: 0 },
    pro: { priceEur: 19, pins: 150, aiImages: 100, aiTexts: 300, autopilotPerDay: 3 },
    business: { priceEur: 49, pins: 600, aiImages: 300, aiTexts: 1000, autopilotPerDay: 5 },
  },
} as const;

export const PINTEREST_CLAIM_URL = 'https://help.pinterest.com/en/business/article/claim-your-website';

export const PINTEREST_CLAIM_URLS = {
  en: 'https://help.pinterest.com/en/business/article/claim-your-website',
  fr: 'https://help.pinterest.com/fr/business/article/claim-your-website',
  es: 'https://help.pinterest.com/es/business/article/claim-your-website',
  pt: 'https://help.pinterest.com/pt-br/business/article/claim-your-website',
  nl: 'https://help.pinterest.com/nl/business/article/claim-your-website',
} as const;

export const PINTEREST_SHOPIFY_URL = 'https://help.pinterest.com/en/business/article/link-your-shopify-and-pinterest-accounts';

export const ETSY_HANDBOOK_URL =
  'https://www.etsy.com/seller-handbook/article/how-to-promote-your-etsy-shop-with/22820978165';
