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
    seeDemo: string;
    perMonth: string;
    popular: string;
    free: string;
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
  features: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{ title: string; description: string }>;
  };
  howItWorks: {
    badge: string;
    title: string;
    subtitle: string;
    ready: string;
    cta: string;
    steps: Array<{ title: string; description: string }>;
  };
  pricing: {
    badge: string;
    title: string;
    subtitle: string;
    plans: Array<{
      name: string;
      description: string;
      features: string[];
      cta: string;
    }>;
  };
  testimonials: {
    badge: string;
    title: string;
    subtitle: string;
    stats: Array<{ value: string; label: string }>;
    items: Array<{ name: string; role: string; content: string }>;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{ question: string; answer: string }>;
  };
  cta: {
    badge: string;
    title: string;
    subtitle: string;
    createAccount: string;
    seeDemo: string;
    trust: string;
  };
  footer: {
    product: string;
    company: string;
    resources: string;
    legal: string;
    tagline: string;
    rights: string;
    links: {
      features: string;
      pricing: string;
      templates: string;
      integrations: string;
      about: string;
      blog: string;
      careers: string;
      contact: string;
      docs: string;
      tutorials: string;
      help: string;
      community: string;
      privacy: string;
      terms: string;
      cookies: string;
      legalNotice: string;
    };
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    signupTitle: string;
    signupSubtitle: string;
    email: string;
    password: string;
    fullName: string;
    confirmPassword: string;
    rememberMe: string;
    forgotPassword: string;
    submitLogin: string;
    submitSignup: string;
    loggingIn: string;
    creatingAccount: string;
    orContinueWith: string;
    noAccount: string;
    hasAccount: string;
    createAccount: string;
    demoMode: string;
    demoHint: string;
    demoLogin: string;
    passwordRules: string;
    ruleLength: string;
    ruleNumber: string;
    ruleSpecial: string;
    acceptTerms: string;
    terms: string;
    privacy: string;
    and: string;
  };
}

/** Mot de marque — ne jamais traduire */
export const BRAND_PIN = 'Pin';
export const BRAND_PINS = 'Pins';

export const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: 'Français',
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
};
