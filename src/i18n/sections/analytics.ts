import type { AppLocale } from '../types';

export interface AnalyticsDictionary {
  title: string;
  subtitle: string;
  /** Time-range selector options. */
  ranges: {
    '24h': string;
    '7d': string;
    '30d': string;
    '90d': string;
  };
  export: string;
  exportDoneTitle: string;
  exportDoneDesc: string;
  /** KPI card labels. */
  stats: {
    impressions: string;
    saves: string;
    clicks: string;
    engagementRate: string;
  };
  chartTitle: string;
  /** date-fns pattern for the chart's day labels (e.g. `d MMM`). */
  chartDateFormat: string;
  noDataForPeriod: string;
  topPins: string;
  noPublishedPins: string;
  /** `{count}` is interpolated with a formatted number. */
  pinImpressions: string;
  /** `{count}` is interpolated. */
  pinSaves: string;
  boardPerformance: string;
  noBoardData: string;
  /** Fallback board name when a pin has none. */
  defaultBoard: string;
  /** `{count}` is interpolated. */
  pinCountOne: string;
  /** `{count}` is interpolated. */
  pinCountMany: string;
  /** Strings owned by DashboardLayout (sidebar upgrade card, user menu). */
  layout: {
    upgradeTitle: string;
    upgradeDesc: string;
    upgradeCta: string;
    mySubscription: string;
  };
}

export const analytics: Record<AppLocale, AnalyticsDictionary> = {
  fr: {
    title: 'Analytics',
    subtitle: 'Suivez les performances de vos Pins',
    ranges: {
      '24h': '24 heures',
      '7d': '7 jours',
      '30d': '30 jours',
      '90d': '90 jours',
    },
    export: 'Exporter',
    exportDoneTitle: 'Export téléchargé',
    exportDoneDesc: 'Le fichier CSV a été généré.',
    stats: {
      impressions: 'Impressions',
      saves: 'Saves',
      clicks: 'Clics',
      engagementRate: "Taux d'engagement",
    },
    chartTitle: 'Évolution des impressions',
    chartDateFormat: 'd MMM',
    noDataForPeriod: 'Aucune donnée sur cette période.',
    topPins: 'Top Pins',
    noPublishedPins: 'Aucun pin publié pour le moment.',
    pinImpressions: '{count} impressions',
    pinSaves: '{count} saves',
    boardPerformance: 'Performance par tableau',
    noBoardData: 'Publiez des pins pour voir les performances par tableau.',
    defaultBoard: 'Général',
    pinCountOne: '{count} pin',
    pinCountMany: '{count} pins',
    layout: {
      upgradeTitle: 'Passer à Pro',
      upgradeDesc: 'Débloquez tous les fonctionnalités avancées',
      upgradeCta: 'Upgrader',
      mySubscription: 'Mon abonnement',
    },
  },
  en: {
    title: 'Analytics',
    subtitle: 'Track how your Pins are performing',
    ranges: {
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
    },
    export: 'Export',
    exportDoneTitle: 'Export downloaded',
    exportDoneDesc: 'The CSV file has been generated.',
    stats: {
      impressions: 'Impressions',
      saves: 'Saves',
      clicks: 'Clicks',
      engagementRate: 'Engagement rate',
    },
    chartTitle: 'Impressions over time',
    chartDateFormat: 'MMM d',
    noDataForPeriod: 'No data for this period.',
    topPins: 'Top Pins',
    noPublishedPins: 'No published pins yet.',
    pinImpressions: '{count} impressions',
    pinSaves: '{count} saves',
    boardPerformance: 'Performance by board',
    noBoardData: 'Publish pins to see performance by board.',
    defaultBoard: 'General',
    pinCountOne: '{count} pin',
    pinCountMany: '{count} pins',
    layout: {
      upgradeTitle: 'Go Pro',
      upgradeDesc: 'Unlock all advanced features',
      upgradeCta: 'Upgrade',
      mySubscription: 'My subscription',
    },
  },
  es: {
    title: 'Analytics',
    subtitle: 'Sigue el rendimiento de tus Pins',
    ranges: {
      '24h': '24 horas',
      '7d': '7 días',
      '30d': '30 días',
      '90d': '90 días',
    },
    export: 'Exportar',
    exportDoneTitle: 'Exportación descargada',
    exportDoneDesc: 'El archivo CSV se ha generado.',
    stats: {
      impressions: 'Impresiones',
      saves: 'Guardados',
      clicks: 'Clics',
      engagementRate: 'Tasa de interacción',
    },
    chartTitle: 'Evolución de las impresiones',
    chartDateFormat: 'd MMM',
    noDataForPeriod: 'No hay datos para este período.',
    topPins: 'Top Pins',
    noPublishedPins: 'Aún no hay pins publicados.',
    pinImpressions: '{count} impresiones',
    pinSaves: '{count} guardados',
    boardPerformance: 'Rendimiento por tablero',
    noBoardData: 'Publica pins para ver el rendimiento por tablero.',
    defaultBoard: 'General',
    pinCountOne: '{count} pin',
    pinCountMany: '{count} pins',
    layout: {
      upgradeTitle: 'Pasar a Pro',
      upgradeDesc: 'Desbloquea todas las funciones avanzadas',
      upgradeCta: 'Mejorar plan',
      mySubscription: 'Mi suscripción',
    },
  },
  de: {
    title: 'Analytics',
    subtitle: 'Verfolge die Performance deiner Pins',
    ranges: {
      '24h': '24 Stunden',
      '7d': '7 Tage',
      '30d': '30 Tage',
      '90d': '90 Tage',
    },
    export: 'Exportieren',
    exportDoneTitle: 'Export heruntergeladen',
    exportDoneDesc: 'Die CSV-Datei wurde erstellt.',
    stats: {
      impressions: 'Impressionen',
      saves: 'Merken',
      clicks: 'Klicks',
      engagementRate: 'Interaktionsrate',
    },
    chartTitle: 'Entwicklung der Impressionen',
    chartDateFormat: 'd. MMM',
    noDataForPeriod: 'Keine Daten für diesen Zeitraum.',
    topPins: 'Top Pins',
    noPublishedPins: 'Noch keine veröffentlichten Pins.',
    pinImpressions: '{count} Impressionen',
    pinSaves: '{count} Mal gemerkt',
    boardPerformance: 'Performance nach Pinnwand',
    noBoardData: 'Veröffentliche Pins, um die Performance nach Pinnwand zu sehen.',
    defaultBoard: 'Allgemein',
    pinCountOne: '{count} Pin',
    pinCountMany: '{count} Pins',
    layout: {
      upgradeTitle: 'Auf Pro upgraden',
      upgradeDesc: 'Schalte alle erweiterten Funktionen frei',
      upgradeCta: 'Upgraden',
      mySubscription: 'Mein Abonnement',
    },
  },
};
