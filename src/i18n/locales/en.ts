import type { Dictionary } from '../types';
import { dashboardHome } from '../sections/dashboardHome';
import { generator } from '../sections/generator';
import { settings } from '../sections/settings';
import { analytics } from '../sections/analytics';
import { autopilot } from '../sections/autopilot';

const en: Dictionary = {
  dashboardHome: dashboardHome.en,
  generator: generator.en,
  settings: settings.en,
  analytics: analytics.en,
  autopilot: autopilot.en,
  common: {
    login: 'Log in',
    signup: 'Start for free',
    logout: 'Log out',
    save: 'Save',
    cancel: 'Cancel',
    loading: 'Loading…',
    language: 'Language',
    seeDemo: 'See demo',
    perMonth: 'month',
    popular: 'Popular',
    free: 'Free',
    errors: {
      pinLimitReached: 'Monthly pin limit reached for your plan ({limit}). Upgrade to keep creating.',
      quotaExceeded: 'Daily AI quota reached for your plan ({limit}/day). Try again tomorrow or upgrade.',
      quotaExceededMonth: 'Monthly AI quota reached for your plan ({limit}/month). Upgrade to keep going.',
      aiCapacity: 'The AI service is at capacity for today. Please try again a little later.',
      autopilotDisabled: 'Autopilot is switched off for this account.',
      autopilotRequiresPro: 'Autopilot is available on the Pro and Business plans.',
      autopilotDailyLimit: 'Daily autopilot limit reached ({limit} Pins/day on your plan).',
      sessionExpired: 'Your session has expired. Please sign in again.',
      tooManyRequests: 'Too many requests. Wait a moment and try again.',
      imageUploadFailed: 'The pin image could not be saved. Please retry.',
      unknown: 'Something went wrong. Please retry.',
    },
  },
  nav: {
    features: 'Features',
    howItWorks: 'How it works',
    pricing: 'Pricing',
    faq: 'FAQ',
  },
  sidebar: {
    dashboard: 'Dashboard',
    generator: 'Pin Generator',
    autopilot: 'Autopilot',
    schedule: 'Schedule',
    analytics: 'Analytics',
    settings: 'Settings',
  },
  schedule: {
    title: 'Schedule',
    subtitle: 'Manage scheduled Pins, drafts and published Pins',
    calendar: 'Calendar',
    legend: 'Legend',
    scheduled: 'Scheduled',
    draft: 'Draft',
    published: 'Published',
    failed: 'Failed',
    noPinThatDay: 'No Pins on this day.',
    noScheduled: 'No scheduled Pins',
    noDrafts: 'No drafts',
    noPublished: 'No published Pins',
    createPin: 'Create a Pin',
    autopilot: 'Autopilot',
    planPin: 'Schedule Pin',
    reschedulePin: 'Reschedule Pin',
    chooseDateTime: 'Choose a publish date and time',
    publishTime: 'Publish time',
    plan: 'Schedule',
    reschedule: 'Reschedule',
    editPin: 'Edit Pin',
    editPinDesc: 'Edit your Pin title and description',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    modify: 'Edit',
    cancelSchedule: 'Cancel',
    delete: 'Delete',
    createdOn: 'Created on',
    publishedOn: 'Published on',
    viewPin: 'Pin details',
    hashtags: 'Hashtags',
    altText: 'Alt text',
    link: 'Link',
    copyHashtags: 'Copy hashtags',
    close: 'Close',
    errorTitle: 'Error',
    pinDeleted: 'Pin deleted',
    deleteFailed: 'Could not delete the pin',
    scheduleCancelled: 'Schedule cancelled',
    cancelFailed: 'Could not cancel the schedule',
    pinScheduled: 'Pin scheduled',
    pinRescheduled: 'Pin rescheduled',
    publishOn: 'Publishing on {date}',
    rescheduleFailed: 'Could not reschedule the pin',
    copyFailed: 'Could not copy',
    titleRequired: 'Title required',
    titleEmpty: 'The title cannot be empty.',
    pinUpdated: 'Pin updated',
    updateFailed: 'Could not update the pin',
    deleteConfirm: 'Are you sure you want to delete this pin?',
  },
  publish: {
    publish: 'Publish',
    publishNow: 'Publish now',
    publishAll: 'Publish all now',
    publishAllConfirm:
      'Publish ALL scheduled pins to Pinterest right now, including those planned for later?',
    publishing: 'Publishing…',
    nothingToPublish: 'No pins to publish',
    nothingToPublishDesc: 'No scheduled pin matches this action.',
    publishedOne: 'Pin published to Pinterest!',
    publishedMany: '{count} pins published to Pinterest!',
    partialFailure: '{ok} published, {ko} failed',
    publishFailed: 'Publishing failed',
    publishError: 'Publishing error',
    cannotPublish: 'Could not publish the pin',
    sessionExpired: 'Session expired, please sign in again.',
    awaitingAccessTitle: '{count} pin(s) awaiting Pinterest approval',
    awaitingAccessBody:
      'Your Pinterest app has "Trial" access: Pinterest does not allow real publishing yet. Request "Standard" access from your developer dashboard; your scheduled pins will be published automatically once approved, nothing to redo.',
    awaitingAccessPin:
      'Awaiting Pinterest approval ("Trial" access). This pin will be published automatically once approved.',
    awaitingAccessShort: '{count} pin(s) awaiting Pinterest approval.',
    openPinterestDev: 'Open developers.pinterest.com',
    readyToPublish: '{count} pin(s) ready to publish',
    readyToPublishDesc: 'These pins are scheduled for now or earlier.',
    autoPublishing: 'Auto-publishing in progress…',
    autoPublishFailed: 'Auto-publishing failed',
    someFailed: '{count} pin(s) could not be published.',
  },
  hero: {
    titleBefore: 'Automate your',
    titleHighlight: 'Pinterest',
    titleAfter: 'and grow your traffic',
    subtitle:
      'Create, schedule and publish optimized Pins automatically. Save time and grow your business.',
    cta: 'Start for free',
    login: 'Log in',
  },
  features: {
    badge: 'Features',
    title: 'Everything you need to succeed on Pinterest',
    subtitle:
      'Powerful, intuitive tools to create, schedule and analyze your Pinterest content like a pro.',
    items: [
      {
        title: 'AI Pin generation',
        description:
          'Create professional Pins in seconds with AI trained on Pinterest best practices.',
      },
      {
        title: 'Smart scheduling',
        description:
          'Schedule posts at the best times to maximize reach and engagement.',
      },
      {
        title: 'Advanced analytics',
        description:
          'Track performance in real time with detailed dashboards and actionable insights.',
      },
      {
        title: 'Professional templates',
        description:
          'Access 500+ templates optimized for every niche and format.',
      },
      {
        title: 'Optimized hashtags',
        description:
          'Automatically generate the best hashtags for each Pin based on current trends.',
      },
      {
        title: 'Audience targeting',
        description:
          'Identify and target your ideal audience with personalized recommendations.',
      },
      {
        title: 'SEO optimization',
        description:
          'Automatically optimize titles, descriptions and metadata for Pinterest SEO.',
      },
      {
        title: 'Automatic publishing',
        description:
          'Publish automatically to multiple boards and accounts with no manual work.',
      },
    ],
  },
  howItWorks: {
    badge: 'How it works',
    title: 'From creation to publish in 4 simple steps',
    subtitle:
      'An optimized workflow that saves you hours every week while improving results.',
    ready: 'Ready to automate your Pinterest?',
    cta: 'Start for free',
    steps: [
      {
        title: 'Import your content',
        description:
          'Upload images, videos or connect existing sources (Instagram, website, etc.).',
      },
      {
        title: 'Let AI do the work',
        description:
          'Our AI automatically generates optimized Pins with catchy titles, SEO descriptions and relevant hashtags.',
      },
      {
        title: 'Bulk schedule',
        description:
          'Pick your best time slots and let PinGen publish automatically at the optimal moment.',
      },
      {
        title: 'Watch your results',
        description:
          'Track growth in real time and let recommendations refine your strategy for even better results.',
      },
    ],
  },
  pricing: {
    badge: 'Pricing',
    title: 'Simple pricing, no surprises',
    subtitle:
      'Start free and upgrade when you are ready. Cancel anytime.',
    plans: [
      {
        name: 'Starter',
        description: 'Perfect to get started',
        features: [
          '5 Pins per month',
          '5 AI images per month',
          '20 AI texts per month',
          '1 Pinterest account',
          'Manual scheduling',
        ],
        cta: 'Start for free',
      },
      {
        name: 'Pro',
        description: 'For serious creators',
        features: [
          '100 Pins per month',
          '100 AI images per month',
          '300 AI texts per month',
          'Autopilot: up to 3 Pins / day',
          'Automatic scheduling',
          'Priority support',
        ],
        cta: 'Upgrade to Pro',
      },
      {
        name: 'Business',
        description: 'For teams and agencies',
        features: [
          '300 Pins per month',
          '300 AI images per month',
          '1,000 AI texts per month',
          'Autopilot: up to 5 Pins / day',
          'Automatic scheduling',
          'Dedicated support',
        ],
        cta: 'Upgrade to Business',
      },
    ],
  },
  testimonials: {
    badge: 'Testimonials',
    title: 'They grow Pinterest with PinGen',
    subtitle: 'Creators and brands saving time and scaling growth.',
    stats: [
      { value: '50K+', label: 'Active users' },
      { value: '2M+', label: 'Pins created' },
      { value: '4.9/5', label: 'Average rating' },
      { value: '300%', label: 'Average growth' },
    ],
    items: [
      {
        name: 'Marie Dubois',
        role: 'Content creator',
        content:
          'PinGen completely transformed my Pinterest strategy. I save 10 hours a week and my views grew 400% in 2 months.',
      },
      {
        name: 'Thomas Martin',
        role: 'E-commerce entrepreneur',
        content:
          'Autopilot and Pin generation let me scale my catalog without hiring. Concrete results from month one.',
      },
      {
        name: 'Sophie Bernard',
        role: 'Marketing manager',
        content:
          'We manage 5 Pinterest accounts for clients. PinGen saves us dozens of hours every month. Essential!',
      },
      {
        name: 'Lucas Petit',
        role: 'Lifestyle influencer',
        content:
          'AI generation is incredible. I create professional Pins in seconds. My audience doubled in 3 months.',
      },
      {
        name: 'Emma Richard',
        role: 'Food blogger',
        content:
          'I thought Pinterest was too time-consuming. PinGen changed that. Now I publish 3x more with 10x less effort.',
      },
      {
        name: 'Alexandre Moreau',
        role: 'Digital agency',
        content:
          'We recommend PinGen to all our clients. The ROI is outstanding and support is fast and competent.',
      },
    ],
  },
  faq: {
    badge: 'FAQ',
    title: 'Frequently asked questions',
    subtitle:
      'Everything you need to know about PinGen. Can’t find your answer? Contact us.',
    items: [
      {
        question: 'How does AI Pin generation work?',
        answer:
          'Our AI analyzes your content and automatically generates optimized Pins with catchy titles, SEO-friendly descriptions and relevant hashtags. You can customize everything before publishing.',
      },
      {
        question: 'Can I use PinGen with multiple Pinterest accounts?',
        answer:
          'Each workspace is linked to one Pinterest account. Multi-account support is coming soon; in the meantime you can create one workspace per account.',
      },
      {
        question: 'Is there a limit to how many Pins I can create?',
        answer:
          'Limits depend on your plan: Starter (5 Pins and 5 AI images/month), Pro (100 Pins and 100 AI images/month), Business (300 Pins and 300 AI images/month). You can upgrade anytime if you hit your limit.',
      },
      {
        question: 'Can I cancel my subscription anytime?',
        answer:
          'Absolutely! Cancel anytime from your dashboard. You keep access until the end of your billing period.',
      },
      {
        question: 'How does automatic scheduling work?',
        answer:
          'PinGen analyzes your audiences and automatically picks the best publish times to maximize engagement. You can also set your own custom schedule.',
      },
      {
        question: 'Do you offer a free trial?',
        answer:
          'Yes! Our Starter plan is free forever: up to 5 Pins and 5 AI images per month, no credit card required. Upgrade to Pro or Business whenever you like, and cancel anytime.',
      },
      {
        question: 'Is my data secure?',
        answer:
          'Security is our priority. We use bank-level encryption, never store your Pinterest passwords, and are GDPR compliant.',
      },
      {
        question: 'How can I get help?',
        answer:
          'Email support is available for all users. Pro gets priority support, and Business includes 24/7 dedicated support with an account manager.',
      },
    ],
  },
  cta: {
    badge: 'Start free today',
    title: 'Ready to transform your Pinterest?',
    subtitle:
      'Join 50,000+ creators who save time and grow their audience with PinGen. Free trial, no commitment.',
    createAccount: 'Create my free account',
    seeDemo: 'See demo',
    trust: 'No credit card required • Cancel anytime',
  },
  footer: {
    product: 'Product',
    company: 'Company',
    resources: 'Resources',
    legal: 'Legal',
    tagline: 'Automate your Pins and grow your Pinterest traffic.',
    rights: 'All rights reserved.',
    links: {
      features: 'Features',
      pricing: 'Pricing',
      templates: 'Templates',
      integrations: 'Integrations',
      about: 'About',
      blog: 'Blog',
      careers: 'Careers',
      contact: 'Contact',
      docs: 'Documentation',
      tutorials: 'Tutorials',
      help: 'Help center',
      community: 'Community',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies',
      legalNotice: 'Legal notice',
    },
  },
  auth: {
    loginTitle: 'Log in',
    loginSubtitle: 'Enter your credentials to access your account',
    signupTitle: 'Create an account',
    signupSubtitle: 'Start free and improve your Pinterest',
    email: 'Email',
    password: 'Password',
    fullName: 'Full name',
    confirmPassword: 'Confirm password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    submitLogin: 'Log in',
    submitSignup: 'Create my account',
    loggingIn: 'Signing in…',
    creatingAccount: 'Creating account…',
    orContinueWith: 'Or continue with',
    noAccount: 'No account yet?',
    hasAccount: 'Already have an account?',
    createAccount: 'Create an account',
    demoMode: 'Demo mode',
    demoHint: 'Try PinGen without creating an account using the demo account',
    demoLogin: 'Sign in with demo account',
    passwordRules: 'Password must contain:',
    ruleLength: '8 characters min',
    ruleNumber: 'One number',
    ruleSpecial: 'One special character',
    acceptTerms: 'I accept the',
    terms: 'terms of use',
    privacy: 'privacy policy',
    and: 'and the',
    successTitle: 'Account created!',
    successDesc: 'Check your email to confirm your account.',
    emailSent: 'A confirmation email has been sent to {email}. Click the link to activate your account.',
    goToLogin: 'Go to login',
    errorAcceptTerms: 'Please accept the Terms of Service and the Privacy Policy.',
    errorPasswordMismatch: 'Passwords do not match.',
    errorPasswordWeak: 'The password does not meet the security requirements.',
    errorSignupFailed: 'Sign-up failed.',
    errorLoginFailed: 'Login failed.',
    errorSessionMissing: 'Logged in but no session was found. Please try again.',
    errorOAuthFailed: 'OAuth login failed. Please try again.',
  },
  pages: {
    notFoundLabel: 'Error 404',
    notFoundTitle: 'This page does not exist',
    notFoundDesc: 'The link is wrong or the page has moved. Go back home or open the dashboard.',
    backHome: 'Back to home',
    dashboard: 'Dashboard',
    comingSoonLabel: 'Coming soon',
    comingSoonTitle: 'This page is coming soon',
    comingSoonDesc: 'We are preparing this section. In the meantime, discover GenX or create an account.',
    home: 'Home',
    createAccount: 'Create an account',
  },
  ai: {
    fallbackTitle: 'Discover this inspiring idea',
    fallbackDescription: 'A great idea to try right now. Perfect for your next project!',
    fallbackAltText: 'Inspiring image for Pinterest',
    fallbackHashtags: ['#inspiration', '#ideas', '#creative'],
    ideaTemplates: ['10 tips for {topic}', 'How to succeed with {topic}', 'Mistakes to avoid with {topic}', 'Complete guide: {topic}', 'Daily {topic} inspiration'],
    businessDescription: 'An inspiring idea for {business}. Perfect for your audience.',
    boardGeneral: 'General',
    duplicateExact: 'An identical pin already exists: "{title}" ({status}, created on {date})',
    duplicateSimilar: 'A very similar pin already exists: "{title}" ({status}, created on {date})',
    errors: {
      modelUnavailable: 'The AI model is no longer available. Please try again shortly.',
      unreachable: 'The AI service cannot be reached. Please try again shortly.',
      insufficientCredit: 'Insufficient AI credit. Top up OpenRouter (text) or Grok (images).',
      notEnabled: 'The AI service is not enabled on this environment yet.',
      saturated: 'The AI service is temporarily overloaded. Please try again shortly.',
      rejected: 'The AI service rejected the request. Adjust your content and try again.',
      forbidden: 'Access denied by the AI service. Try again later or contact support.',
      unknown: 'Unknown error during generation.',
    },
  },
};

export default en;
