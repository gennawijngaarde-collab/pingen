import type { AppLocale } from '../types';

export interface DashboardHomeDictionary {
  autopilotTitle: string;
  statusActive: string;
  statusInactive: string;
  /** Uses `{count}` */
  autopilotPinsPerDay: string;
  autopilotHoursFallback: string;
  autopilotDisabledHint: string;
  manage: string;
  configure: string;
  /** Uses `{name}` */
  greeting: string;
  defaultUserName: string;
  welcomeSubtitle: string;
  navAutopilot: string;
  navCalendar: string;
  createPin: string;
  statImpressions: string;
  statSaves: string;
  statClicks: string;
  statEngagement: string;
  recentPins: string;
  viewAll: string;
  noPinsYet: string;
  createFirstPin: string;
  statusPublished: string;
  statusScheduled: string;
  statusDraft: string;
  /** Uses `{date}` */
  publishedOn: string;
  /** date-fns format pattern for the published date (day + short month) */
  publishedDateFormat: string;
  /** date-fns format pattern for the scheduled date (day + short month + time) */
  scheduledDateFormat: string;
  planUsageTitle: string;
  pinsThisMonth: string;
  pinterestAccounts: string;
  currentPlan: string;
  upgradeToPro: string;
  quickActionsTitle: string;
  configureAutopilot: string;
  generatePinWithAi: string;
  schedulePins: string;
  viewAnalytics: string;
  tipOfTheDay: string;
  tipContent: string;
}

export const dashboardHome: Record<AppLocale, DashboardHomeDictionary> = {
  fr: {
    autopilotTitle: 'Autopilote Pinterest',
    statusActive: 'Actif',
    statusInactive: 'Inactif',
    autopilotPinsPerDay: '{count} pin(s)/jour',
    autopilotHoursFallback: 'horaires à définir',
    autopilotDisabledHint: 'Activez la génération automatique selon votre business et vos horaires.',
    manage: 'Gérer',
    configure: 'Configurer',
    greeting: 'Bonjour, {name} ! 👋',
    defaultUserName: 'Utilisateur',
    welcomeSubtitle: "Voici ce qui se passe avec votre Pinterest aujourd'hui.",
    navAutopilot: 'Autopilote',
    navCalendar: 'Calendrier',
    createPin: 'Créer un Pin',
    statImpressions: 'Impressions',
    statSaves: 'Saves',
    statClicks: 'Clics',
    statEngagement: 'Engagement',
    recentPins: 'Pins récents',
    viewAll: 'Voir tout',
    noPinsYet: "Vous n'avez pas encore de pins.",
    createFirstPin: 'Créer mon premier Pin',
    statusPublished: 'Publié',
    statusScheduled: 'Planifié',
    statusDraft: 'Brouillon',
    publishedOn: 'Publié le {date}',
    publishedDateFormat: 'd MMM',
    scheduledDateFormat: 'd MMM p',
    planUsageTitle: 'Utilisation du plan',
    pinsThisMonth: 'Pins ce mois',
    pinterestAccounts: 'Comptes Pinterest',
    currentPlan: 'Plan actuel:',
    upgradeToPro: 'Passer à Pro',
    quickActionsTitle: 'Actions rapides',
    configureAutopilot: "Configurer l'autopilote",
    generatePinWithAi: 'Générer un Pin avec IA',
    schedulePins: 'Planifier des Pins',
    viewAnalytics: 'Voir les analytics',
    tipOfTheDay: 'Conseil du jour',
    tipContent: 'Publiez entre 14h et 16h pour maximiser votre engagement sur Pinterest.',
  },
  en: {
    autopilotTitle: 'Pinterest Autopilot',
    statusActive: 'Active',
    statusInactive: 'Inactive',
    autopilotPinsPerDay: '{count} pin(s)/day',
    autopilotHoursFallback: 'schedule to be set',
    autopilotDisabledHint: 'Enable automatic generation based on your business and your schedule.',
    manage: 'Manage',
    configure: 'Set up',
    greeting: 'Hello, {name}! 👋',
    defaultUserName: 'User',
    welcomeSubtitle: "Here's what's happening with your Pinterest today.",
    navAutopilot: 'Autopilot',
    navCalendar: 'Calendar',
    createPin: 'Create a Pin',
    statImpressions: 'Impressions',
    statSaves: 'Saves',
    statClicks: 'Clicks',
    statEngagement: 'Engagement',
    recentPins: 'Recent Pins',
    viewAll: 'View all',
    noPinsYet: "You don't have any pins yet.",
    createFirstPin: 'Create my first Pin',
    statusPublished: 'Published',
    statusScheduled: 'Scheduled',
    statusDraft: 'Draft',
    publishedOn: 'Published on {date}',
    publishedDateFormat: 'MMM d',
    scheduledDateFormat: 'MMM d, p',
    planUsageTitle: 'Plan usage',
    pinsThisMonth: 'Pins this month',
    pinterestAccounts: 'Pinterest accounts',
    currentPlan: 'Current plan:',
    upgradeToPro: 'Upgrade to Pro',
    quickActionsTitle: 'Quick actions',
    configureAutopilot: 'Set up autopilot',
    generatePinWithAi: 'Generate a Pin with AI',
    schedulePins: 'Schedule Pins',
    viewAnalytics: 'View analytics',
    tipOfTheDay: 'Tip of the day',
    tipContent: 'Post between 2 PM and 4 PM to maximize your engagement on Pinterest.',
  },
  es: {
    autopilotTitle: 'Piloto automático de Pinterest',
    statusActive: 'Activo',
    statusInactive: 'Inactivo',
    autopilotPinsPerDay: '{count} pin(es)/día',
    autopilotHoursFallback: 'horarios por definir',
    autopilotDisabledHint: 'Activa la generación automática según tu negocio y tus horarios.',
    manage: 'Gestionar',
    configure: 'Configurar',
    greeting: '¡Hola, {name}! 👋',
    defaultUserName: 'Usuario',
    welcomeSubtitle: 'Esto es lo que está pasando hoy con tu Pinterest.',
    navAutopilot: 'Piloto automático',
    navCalendar: 'Calendario',
    createPin: 'Crear un Pin',
    statImpressions: 'Impresiones',
    statSaves: 'Guardados',
    statClicks: 'Clics',
    statEngagement: 'Interacción',
    recentPins: 'Pins recientes',
    viewAll: 'Ver todo',
    noPinsYet: 'Aún no tienes pins.',
    createFirstPin: 'Crear mi primer Pin',
    statusPublished: 'Publicado',
    statusScheduled: 'Programado',
    statusDraft: 'Borrador',
    publishedOn: 'Publicado el {date}',
    publishedDateFormat: 'd MMM',
    scheduledDateFormat: 'd MMM p',
    planUsageTitle: 'Uso del plan',
    pinsThisMonth: 'Pins este mes',
    pinterestAccounts: 'Cuentas de Pinterest',
    currentPlan: 'Plan actual:',
    upgradeToPro: 'Pasar a Pro',
    quickActionsTitle: 'Acciones rápidas',
    configureAutopilot: 'Configurar el piloto automático',
    generatePinWithAi: 'Generar un Pin con IA',
    schedulePins: 'Programar Pins',
    viewAnalytics: 'Ver las analíticas',
    tipOfTheDay: 'Consejo del día',
    tipContent: 'Publica entre las 14 h y las 16 h para maximizar tu interacción en Pinterest.',
  },
  de: {
    autopilotTitle: 'Pinterest-Autopilot',
    statusActive: 'Aktiv',
    statusInactive: 'Inaktiv',
    autopilotPinsPerDay: '{count} Pin(s)/Tag',
    autopilotHoursFallback: 'Zeiten noch festzulegen',
    autopilotDisabledHint: 'Aktiviere die automatische Erstellung passend zu deinem Business und deinen Zeiten.',
    manage: 'Verwalten',
    configure: 'Einrichten',
    greeting: 'Hallo, {name}! 👋',
    defaultUserName: 'Nutzer',
    welcomeSubtitle: 'Das passiert heute auf deinem Pinterest.',
    navAutopilot: 'Autopilot',
    navCalendar: 'Kalender',
    createPin: 'Pin erstellen',
    statImpressions: 'Impressionen',
    statSaves: 'Gespeichert',
    statClicks: 'Klicks',
    statEngagement: 'Interaktion',
    recentPins: 'Neueste Pins',
    viewAll: 'Alle anzeigen',
    noPinsYet: 'Du hast noch keine Pins.',
    createFirstPin: 'Meinen ersten Pin erstellen',
    statusPublished: 'Veröffentlicht',
    statusScheduled: 'Geplant',
    statusDraft: 'Entwurf',
    publishedOn: 'Veröffentlicht am {date}',
    publishedDateFormat: 'd. MMM',
    scheduledDateFormat: 'd. MMM p',
    planUsageTitle: 'Plan-Nutzung',
    pinsThisMonth: 'Pins diesen Monat',
    pinterestAccounts: 'Pinterest-Konten',
    currentPlan: 'Aktueller Plan:',
    upgradeToPro: 'Auf Pro upgraden',
    quickActionsTitle: 'Schnellaktionen',
    configureAutopilot: 'Autopilot einrichten',
    generatePinWithAi: 'Pin mit KI generieren',
    schedulePins: 'Pins planen',
    viewAnalytics: 'Analytics ansehen',
    tipOfTheDay: 'Tipp des Tages',
    tipContent: 'Veröffentliche zwischen 14 und 16 Uhr, um deine Interaktion auf Pinterest zu maximieren.',
  },
};
