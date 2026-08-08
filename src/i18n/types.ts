export type AppLocale = 'fr' | 'en' | 'es' | 'de';

export interface Dictionary {
  common: {
    login: string;
    signup: string;
    logout: string;
    save: string;
    cancel: string;
    loading: string;
    language: string;
  };
  nav: {
    features: string;
    howItWorks: string;
    pricing: string;
    faq: string;
  };
  sidebar: {
    dashboard: string;
    generator: string;
    autopilot: string;
    schedule: string;
    analytics: string;
    settings: string;
  };
  schedule: {
    title: string;
    subtitle: string;
    calendar: string;
    legend: string;
    scheduled: string;
    draft: string;
    published: string;
    failed: string;
    noPinThatDay: string;
    noScheduled: string;
    noDrafts: string;
    noPublished: string;
    createPin: string;
    autopilot: string;
    planPin: string;
    reschedulePin: string;
    chooseDateTime: string;
    publishTime: string;
    plan: string;
    reschedule: string;
    editPin: string;
    editPinDesc: string;
    titleLabel: string;
    descriptionLabel: string;
    modify: string;
    cancelSchedule: string;
    delete: string;
    createdOn: string;
    publishedOn: string;
    viewPin: string;
    hashtags: string;
    altText: string;
    link: string;
    copyHashtags: string;
    close: string;
  };
  hero: {
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    cta: string;
    login: string;
  };
}

export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};
