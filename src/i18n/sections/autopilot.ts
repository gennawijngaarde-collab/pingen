import type { AppLocale } from '../types';

export interface AutopilotDictionary {
  title: string;
  subtitle: string;
  toggleLabel: string;
  active: string;
  inactive: string;
  stopped: string;

  businessCardTitle: string;
  businessCardDesc: string;
  businessLabel: string;
  businessPlaceholder: string;
  websiteLabel: string;
  websitePlaceholder: string;
  offerLabel: string;
  offerPlaceholder: string;
  audienceLabel: string;
  audiencePlaceholder: string;
  nicheLabel: string;
  /** Labels for niche chips. Keys match the stored niche values. */
  niches: {
    decoration: string;
    fashion: string;
    cooking: string;
    travel: string;
    fitness: string;
    diy: string;
    tech: string;
    business: string;
    art: string;
    photography: string;
  };
  toneLabel: string;
  tones: {
    professional: string;
    casual: string;
    inspiring: string;
    educational: string;
    funny: string;
  };

  statusTitle: string;
  stateLabel: string;
  generatedPins: string;
  lastGeneration: string;
  upcomingTitle: string;
  upcomingDesc: string;
  noSlots: string;

  scheduleCardTitle: string;
  scheduleCardDesc: string;
  postsPerDay: string;
  lookAheadDays: string;
  /** `{min}` and `{max}` are interpolated. */
  rangeHint: string;
  hoursLabel: string;
  resetHours: string;
  /** `{hours}` (comma-separated list) and `{count}` are interpolated. */
  selectedHours: string;
  noneSelected: string;
  saving: string;
  saveSettings: string;
  generating: string;
  generateNow: string;

  validationBusiness: string;
  validationHours: string;

  incompleteConfigTitle: string;
  enabledTitle: string;
  savedTitle: string;
  /** `{count}` and `{hours}` are interpolated. */
  enabledDesc: string;
  savedDesc: string;
  generatedTitle: string;
  generatedDesc: string;
  upToDateTitle: string;
  calendarFull: string;
  nothingToGenerate: string;
  errorTitle: string;
  generationFailed: string;

  bulk: {
    trigger: string;
    /** `{count}` is interpolated. */
    scheduleCount: string;
    description: string;
    manual: string;
    manualDesc: string;
    auto: string;
    autoDesc: string;
    startDate: string;
    interval: string;
    /** `{count}` is interpolated. */
    minutes: string;
    oneHour: string;
    /** `{count}` is interpolated. */
    hours: string;
    autoInfo: string;
    bestTimes: {
      morning: string;
      noon: string;
      afternoon: string;
      evening: string;
      night: string;
    };
    postsPerDay: string;
    /** `{count}` is interpolated. */
    perDay: string;
    scheduling: string;
    scheduledTitle: string;
    /** `{count}` and `{minutes}` are interpolated. */
    scheduledDesc: string;
    autoScheduledTitle: string;
    /** `{count}` and `{perDay}` are interpolated. */
    autoScheduledDesc: string;
    errorTitle: string;
    errorDesc: string;
  };

  worker: {
    generatedTitle: string;
    /** `{count}` is interpolated. */
    generatedDesc: string;
    publishedTitle: string;
    /** `{count}` is interpolated. */
    publishedDesc: string;
    publishFailedTitle: string;
    /** `{count}` is interpolated. */
    publishFailedDesc: string;
  };
}

export const autopilot: Record<AppLocale, AutopilotDictionary> = {
  fr: {
    title: 'Autopilote Pinterest',
    subtitle:
      'Génère et planifie des pins automatiquement selon votre business, aux heures que vous choisissez — pour augmenter le trafic vers votre site sans y passer vos journées.',
    toggleLabel: 'Autopilote',
    active: 'Actif',
    inactive: 'Inactif',
    stopped: 'Arrêté',

    businessCardTitle: '1. Votre business',
    businessCardDesc: "L'IA s'appuie sur ces infos pour créer des pins variés et orientés trafic.",
    businessLabel: 'Description du business *',
    businessPlaceholder:
      'Ex. Boutique en ligne de bougies artisanales naturelles, style cosy scandinave…',
    websiteLabel: 'URL de votre site (lien des pins)',
    websitePlaceholder: 'https://monsite.com',
    offerLabel: 'Offre / produit (optionnel)',
    offerPlaceholder: 'Ex. Kit découverte, coaching…',
    audienceLabel: 'Audience (optionnel)',
    audiencePlaceholder: 'Ex. Femmes 25–40 ans',
    nicheLabel: 'Niche',
    niches: {
      decoration: 'Décoration',
      fashion: 'Mode',
      cooking: 'Cuisine',
      travel: 'Voyage',
      fitness: 'Fitness',
      diy: 'DIY',
      tech: 'Technologie',
      business: 'Business',
      art: 'Art',
      photography: 'Photographie',
    },
    toneLabel: 'Ton',
    tones: {
      professional: 'Professionnel',
      casual: 'Décontracté',
      inspiring: 'Inspirant',
      educational: 'Éducatif',
      funny: 'Humoristique',
    },

    statusTitle: 'Statut',
    stateLabel: 'État',
    generatedPins: 'Pins générés',
    lastGeneration: 'Dernière génération',
    upcomingTitle: 'Prochains créneaux',
    upcomingDesc: 'Selon vos horaires (aperçu)',
    noSlots: 'Aucun créneau configuré.',

    scheduleCardTitle: '2. Horaires de publication',
    scheduleCardDesc:
      "L'autopilote crée des pins pour ces heures, tous les jours, et les publie via le planificateur (compte Pinterest connecté).",
    postsPerDay: 'Pins par jour',
    lookAheadDays: "Jours à l'avance",
    rangeHint: 'Entre {min} et {max}',
    hoursLabel: 'Heures (heure locale)',
    resetHours: 'Réinitialiser (9h / 13h / 19h)',
    selectedHours: 'Sélectionnés : {hours}. Max {count} pin(s) / jour parmi ces heures.',
    noneSelected: 'aucun',
    saving: 'Enregistrement…',
    saveSettings: 'Enregistrer les paramètres',
    generating: 'Génération…',
    generateNow: 'Générer un pin maintenant',

    validationBusiness: "Décrivez votre business pour activer l'autopilote.",
    validationHours: 'Choisissez au moins une heure de publication.',

    incompleteConfigTitle: 'Configuration incomplète',
    enabledTitle: 'Autopilote activé',
    savedTitle: 'Paramètres enregistrés',
    enabledDesc: '{count} pin(s)/jour aux horaires : {hours}',
    savedDesc: 'Vos réglages ont été sauvegardés.',
    generatedTitle: 'Pin généré et planifié',
    generatedDesc: 'Un nouveau pin a été ajouté à votre calendrier autopilote.',
    upToDateTitle: 'Calendrier à jour',
    calendarFull: 'Tous les créneaux à venir sont déjà remplis.',
    nothingToGenerate: 'Rien à générer pour le moment.',
    errorTitle: 'Erreur autopilote',
    generationFailed: 'Génération impossible',

    bulk: {
      trigger: 'Planification en masse',
      scheduleCount: 'Planifier {count} pins',
      description: 'Choisissez comment vous souhaitez planifier vos pins',
      manual: 'Manuel',
      manualDesc: "Définissez l'intervalle entre chaque pin",
      auto: 'Automatique',
      autoDesc: 'Aux meilleurs horaires automatiquement',
      startDate: 'Date de début',
      interval: 'Intervalle entre les pins',
      minutes: '{count} minutes',
      oneHour: '1 heure',
      hours: '{count} heures',
      autoInfo:
        "Les pins seront planifiés automatiquement aux meilleurs horaires pour maximiser l'engagement :",
      bestTimes: {
        morning: '8h00 - 9h00 (matin)',
        noon: '12h00 - 13h00 (midi)',
        afternoon: '15h00 - 16h00 (après-midi)',
        evening: '18h00 - 19h00 (soir)',
        night: '21h00 - 22h00 (nuit)',
      },
      postsPerDay: 'Publications par jour',
      perDay: '{count} par jour',
      scheduling: 'Planification...',
      scheduledTitle: 'Pins planifiés !',
      scheduledDesc: '{count} pins planifiés avec un intervalle de {minutes} minutes',
      autoScheduledTitle: 'Pins planifiés automatiquement !',
      autoScheduledDesc: '{count} pins planifiés aux meilleurs horaires ({perDay}/jour)',
      errorTitle: 'Erreur',
      errorDesc: 'Impossible de planifier les pins',
    },

    worker: {
      generatedTitle: 'Autopilote : pin généré',
      generatedDesc: '{count} pin(s) créé(s) et planifié(s) selon vos horaires.',
      publishedTitle: 'Pins publiés !',
      publishedDesc: '{count} pin(s) publié(s) sur Pinterest',
      publishFailedTitle: 'Erreur de publication',
      publishFailedDesc: "{count} pin(s) n'ont pas pu être publié(s)",
    },
  },

  en: {
    title: 'Pinterest Autopilot',
    subtitle:
      'Automatically generates and schedules pins based on your business, at the times you choose — to drive more traffic to your site without spending your days on it.',
    toggleLabel: 'Autopilot',
    active: 'Active',
    inactive: 'Inactive',
    stopped: 'Stopped',

    businessCardTitle: '1. Your business',
    businessCardDesc: 'The AI uses this info to create varied, traffic-focused pins.',
    businessLabel: 'Business description *',
    businessPlaceholder:
      'E.g. Online shop selling natural handmade candles, cozy Scandinavian style…',
    websiteLabel: 'Your website URL (pin link)',
    websitePlaceholder: 'https://mysite.com',
    offerLabel: 'Offer / product (optional)',
    offerPlaceholder: 'E.g. Starter kit, coaching…',
    audienceLabel: 'Audience (optional)',
    audiencePlaceholder: 'E.g. Women aged 25–40',
    nicheLabel: 'Niche',
    niches: {
      decoration: 'Home decor',
      fashion: 'Fashion',
      cooking: 'Food',
      travel: 'Travel',
      fitness: 'Fitness',
      diy: 'DIY',
      tech: 'Technology',
      business: 'Business',
      art: 'Art',
      photography: 'Photography',
    },
    toneLabel: 'Tone',
    tones: {
      professional: 'Professional',
      casual: 'Casual',
      inspiring: 'Inspiring',
      educational: 'Educational',
      funny: 'Funny',
    },

    statusTitle: 'Status',
    stateLabel: 'State',
    generatedPins: 'Pins generated',
    lastGeneration: 'Last generation',
    upcomingTitle: 'Upcoming slots',
    upcomingDesc: 'Based on your schedule (preview)',
    noSlots: 'No slots configured.',

    scheduleCardTitle: '2. Posting schedule',
    scheduleCardDesc:
      'Autopilot creates pins for these hours every day and publishes them through the scheduler (connected Pinterest account).',
    postsPerDay: 'Pins per day',
    lookAheadDays: 'Days ahead',
    rangeHint: 'Between {min} and {max}',
    hoursLabel: 'Hours (local time)',
    resetHours: 'Reset (9am / 1pm / 7pm)',
    selectedHours: 'Selected: {hours}. Max {count} pin(s) / day across these hours.',
    noneSelected: 'none',
    saving: 'Saving…',
    saveSettings: 'Save settings',
    generating: 'Generating…',
    generateNow: 'Generate a pin now',

    validationBusiness: 'Describe your business to enable Autopilot.',
    validationHours: 'Choose at least one posting hour.',

    incompleteConfigTitle: 'Incomplete configuration',
    enabledTitle: 'Autopilot enabled',
    savedTitle: 'Settings saved',
    enabledDesc: '{count} pin(s)/day at: {hours}',
    savedDesc: 'Your settings have been saved.',
    generatedTitle: 'Pin generated and scheduled',
    generatedDesc: 'A new pin has been added to your Autopilot calendar.',
    upToDateTitle: 'Calendar up to date',
    calendarFull: 'All upcoming slots are already filled.',
    nothingToGenerate: 'Nothing to generate right now.',
    errorTitle: 'Autopilot error',
    generationFailed: 'Generation failed',

    bulk: {
      trigger: 'Bulk scheduling',
      scheduleCount: 'Schedule {count} pins',
      description: 'Choose how you want to schedule your pins',
      manual: 'Manual',
      manualDesc: 'Set the interval between each pin',
      auto: 'Automatic',
      autoDesc: 'At the best times, automatically',
      startDate: 'Start date',
      interval: 'Interval between pins',
      minutes: '{count} minutes',
      oneHour: '1 hour',
      hours: '{count} hours',
      autoInfo:
        'Pins will be scheduled automatically at the best times to maximize engagement:',
      bestTimes: {
        morning: '8:00 - 9:00 AM (morning)',
        noon: '12:00 - 1:00 PM (noon)',
        afternoon: '3:00 - 4:00 PM (afternoon)',
        evening: '6:00 - 7:00 PM (evening)',
        night: '9:00 - 10:00 PM (night)',
      },
      postsPerDay: 'Posts per day',
      perDay: '{count} per day',
      scheduling: 'Scheduling...',
      scheduledTitle: 'Pins scheduled!',
      scheduledDesc: '{count} pins scheduled with a {minutes}-minute interval',
      autoScheduledTitle: 'Pins scheduled automatically!',
      autoScheduledDesc: '{count} pins scheduled at the best times ({perDay}/day)',
      errorTitle: 'Error',
      errorDesc: 'Unable to schedule the pins',
    },

    worker: {
      generatedTitle: 'Autopilot: pin generated',
      generatedDesc: '{count} pin(s) created and scheduled according to your hours.',
      publishedTitle: 'Pins published!',
      publishedDesc: '{count} pin(s) published on Pinterest',
      publishFailedTitle: 'Publishing error',
      publishFailedDesc: '{count} pin(s) could not be published',
    },
  },

  es: {
    title: 'Autopiloto Pinterest',
    subtitle:
      'Genera y programa pines automáticamente según tu negocio, a las horas que elijas — para aumentar el tráfico hacia tu sitio sin pasarte el día en ello.',
    toggleLabel: 'Autopiloto',
    active: 'Activo',
    inactive: 'Inactivo',
    stopped: 'Detenido',

    businessCardTitle: '1. Tu negocio',
    businessCardDesc:
      'La IA se basa en esta información para crear pines variados y orientados al tráfico.',
    businessLabel: 'Descripción del negocio *',
    businessPlaceholder:
      'Ej. Tienda online de velas artesanales naturales, estilo acogedor escandinavo…',
    websiteLabel: 'URL de tu sitio (enlace de los pines)',
    websitePlaceholder: 'https://misitio.com',
    offerLabel: 'Oferta / producto (opcional)',
    offerPlaceholder: 'Ej. Kit de descubrimiento, coaching…',
    audienceLabel: 'Audiencia (opcional)',
    audiencePlaceholder: 'Ej. Mujeres de 25–40 años',
    nicheLabel: 'Nicho',
    niches: {
      decoration: 'Decoración',
      fashion: 'Moda',
      cooking: 'Cocina',
      travel: 'Viajes',
      fitness: 'Fitness',
      diy: 'DIY',
      tech: 'Tecnología',
      business: 'Negocios',
      art: 'Arte',
      photography: 'Fotografía',
    },
    toneLabel: 'Tono',
    tones: {
      professional: 'Profesional',
      casual: 'Informal',
      inspiring: 'Inspirador',
      educational: 'Educativo',
      funny: 'Divertido',
    },

    statusTitle: 'Estado',
    stateLabel: 'Estado',
    generatedPins: 'Pines generados',
    lastGeneration: 'Última generación',
    upcomingTitle: 'Próximos horarios',
    upcomingDesc: 'Según tus horarios (vista previa)',
    noSlots: 'Ningún horario configurado.',

    scheduleCardTitle: '2. Horarios de publicación',
    scheduleCardDesc:
      'El autopiloto crea pines para estas horas, todos los días, y los publica a través del programador (cuenta de Pinterest conectada).',
    postsPerDay: 'Pines por día',
    lookAheadDays: 'Días de antelación',
    rangeHint: 'Entre {min} y {max}',
    hoursLabel: 'Horas (hora local)',
    resetHours: 'Restablecer (9h / 13h / 19h)',
    selectedHours: 'Seleccionadas: {hours}. Máx. {count} pin(es) / día entre estas horas.',
    noneSelected: 'ninguna',
    saving: 'Guardando…',
    saveSettings: 'Guardar la configuración',
    generating: 'Generando…',
    generateNow: 'Generar un pin ahora',

    validationBusiness: 'Describe tu negocio para activar el autopiloto.',
    validationHours: 'Elige al menos una hora de publicación.',

    incompleteConfigTitle: 'Configuración incompleta',
    enabledTitle: 'Autopiloto activado',
    savedTitle: 'Configuración guardada',
    enabledDesc: '{count} pin(es)/día a las: {hours}',
    savedDesc: 'Tus ajustes se han guardado.',
    generatedTitle: 'Pin generado y programado',
    generatedDesc: 'Se ha añadido un nuevo pin a tu calendario de autopiloto.',
    upToDateTitle: 'Calendario al día',
    calendarFull: 'Todos los próximos horarios ya están ocupados.',
    nothingToGenerate: 'Nada que generar por ahora.',
    errorTitle: 'Error del autopiloto',
    generationFailed: 'No se pudo generar',

    bulk: {
      trigger: 'Programación masiva',
      scheduleCount: 'Programar {count} pines',
      description: 'Elige cómo quieres programar tus pines',
      manual: 'Manual',
      manualDesc: 'Define el intervalo entre cada pin',
      auto: 'Automático',
      autoDesc: 'En los mejores horarios, automáticamente',
      startDate: 'Fecha de inicio',
      interval: 'Intervalo entre los pines',
      minutes: '{count} minutos',
      oneHour: '1 hora',
      hours: '{count} horas',
      autoInfo:
        'Los pines se programarán automáticamente en los mejores horarios para maximizar la interacción:',
      bestTimes: {
        morning: '8:00 - 9:00 (mañana)',
        noon: '12:00 - 13:00 (mediodía)',
        afternoon: '15:00 - 16:00 (tarde)',
        evening: '18:00 - 19:00 (atardecer)',
        night: '21:00 - 22:00 (noche)',
      },
      postsPerDay: 'Publicaciones por día',
      perDay: '{count} por día',
      scheduling: 'Programando...',
      scheduledTitle: '¡Pines programados!',
      scheduledDesc: '{count} pines programados con un intervalo de {minutes} minutos',
      autoScheduledTitle: '¡Pines programados automáticamente!',
      autoScheduledDesc: '{count} pines programados en los mejores horarios ({perDay}/día)',
      errorTitle: 'Error',
      errorDesc: 'No se pudieron programar los pines',
    },

    worker: {
      generatedTitle: 'Autopiloto: pin generado',
      generatedDesc: '{count} pin(es) creado(s) y programado(s) según tus horarios.',
      publishedTitle: '¡Pines publicados!',
      publishedDesc: '{count} pin(es) publicado(s) en Pinterest',
      publishFailedTitle: 'Error de publicación',
      publishFailedDesc: '{count} pin(es) no se pudieron publicar',
    },
  },

  de: {
    title: 'Pinterest-Autopilot',
    subtitle:
      'Erstellt und plant automatisch Pins passend zu deinem Business, zu den Zeiten, die du wählst — für mehr Traffic auf deiner Website, ohne dass du deine Tage damit verbringst.',
    toggleLabel: 'Autopilot',
    active: 'Aktiv',
    inactive: 'Inaktiv',
    stopped: 'Gestoppt',

    businessCardTitle: '1. Dein Business',
    businessCardDesc:
      'Die KI nutzt diese Infos, um abwechslungsreiche, traffic-orientierte Pins zu erstellen.',
    businessLabel: 'Beschreibung des Business *',
    businessPlaceholder:
      'z. B. Onlineshop für natürliche handgemachte Kerzen, gemütlicher skandinavischer Stil…',
    websiteLabel: 'URL deiner Website (Pin-Link)',
    websitePlaceholder: 'https://meineseite.com',
    offerLabel: 'Angebot / Produkt (optional)',
    offerPlaceholder: 'z. B. Starter-Kit, Coaching…',
    audienceLabel: 'Zielgruppe (optional)',
    audiencePlaceholder: 'z. B. Frauen zwischen 25 und 40',
    nicheLabel: 'Nische',
    niches: {
      decoration: 'Dekoration',
      fashion: 'Mode',
      cooking: 'Kochen',
      travel: 'Reisen',
      fitness: 'Fitness',
      diy: 'DIY',
      tech: 'Technologie',
      business: 'Business',
      art: 'Kunst',
      photography: 'Fotografie',
    },
    toneLabel: 'Tonalität',
    tones: {
      professional: 'Professionell',
      casual: 'Locker',
      inspiring: 'Inspirierend',
      educational: 'Lehrreich',
      funny: 'Humorvoll',
    },

    statusTitle: 'Status',
    stateLabel: 'Zustand',
    generatedPins: 'Erstellte Pins',
    lastGeneration: 'Letzte Erstellung',
    upcomingTitle: 'Nächste Zeitfenster',
    upcomingDesc: 'Gemäß deinen Zeiten (Vorschau)',
    noSlots: 'Keine Zeitfenster konfiguriert.',

    scheduleCardTitle: '2. Veröffentlichungszeiten',
    scheduleCardDesc:
      'Der Autopilot erstellt täglich Pins für diese Uhrzeiten und veröffentlicht sie über den Planer (verbundenes Pinterest-Konto).',
    postsPerDay: 'Pins pro Tag',
    lookAheadDays: 'Tage im Voraus',
    rangeHint: 'Zwischen {min} und {max}',
    hoursLabel: 'Uhrzeiten (Ortszeit)',
    resetHours: 'Zurücksetzen (9 / 13 / 19 Uhr)',
    selectedHours: 'Ausgewählt: {hours}. Max. {count} Pin(s) / Tag zu diesen Uhrzeiten.',
    noneSelected: 'keine',
    saving: 'Wird gespeichert…',
    saveSettings: 'Einstellungen speichern',
    generating: 'Wird erstellt…',
    generateNow: 'Jetzt einen Pin erstellen',

    validationBusiness: 'Beschreibe dein Business, um den Autopilot zu aktivieren.',
    validationHours: 'Wähle mindestens eine Veröffentlichungszeit.',

    incompleteConfigTitle: 'Unvollständige Konfiguration',
    enabledTitle: 'Autopilot aktiviert',
    savedTitle: 'Einstellungen gespeichert',
    enabledDesc: '{count} Pin(s)/Tag um: {hours}',
    savedDesc: 'Deine Einstellungen wurden gespeichert.',
    generatedTitle: 'Pin erstellt und geplant',
    generatedDesc: 'Ein neuer Pin wurde deinem Autopilot-Kalender hinzugefügt.',
    upToDateTitle: 'Kalender aktuell',
    calendarFull: 'Alle kommenden Zeitfenster sind bereits belegt.',
    nothingToGenerate: 'Derzeit nichts zu erstellen.',
    errorTitle: 'Autopilot-Fehler',
    generationFailed: 'Erstellung fehlgeschlagen',

    bulk: {
      trigger: 'Massenplanung',
      scheduleCount: '{count} Pins planen',
      description: 'Wähle, wie du deine Pins planen möchtest',
      manual: 'Manuell',
      manualDesc: 'Lege den Abstand zwischen den Pins fest',
      auto: 'Automatisch',
      autoDesc: 'Automatisch zu den besten Zeiten',
      startDate: 'Startdatum',
      interval: 'Abstand zwischen den Pins',
      minutes: '{count} Minuten',
      oneHour: '1 Stunde',
      hours: '{count} Stunden',
      autoInfo:
        'Die Pins werden automatisch zu den besten Zeiten geplant, um das Engagement zu maximieren:',
      bestTimes: {
        morning: '8:00 - 9:00 Uhr (morgens)',
        noon: '12:00 - 13:00 Uhr (mittags)',
        afternoon: '15:00 - 16:00 Uhr (nachmittags)',
        evening: '18:00 - 19:00 Uhr (abends)',
        night: '21:00 - 22:00 Uhr (nachts)',
      },
      postsPerDay: 'Veröffentlichungen pro Tag',
      perDay: '{count} pro Tag',
      scheduling: 'Wird geplant...',
      scheduledTitle: 'Pins geplant!',
      scheduledDesc: '{count} Pins im Abstand von {minutes} Minuten geplant',
      autoScheduledTitle: 'Pins automatisch geplant!',
      autoScheduledDesc: '{count} Pins zu den besten Zeiten geplant ({perDay}/Tag)',
      errorTitle: 'Fehler',
      errorDesc: 'Die Pins konnten nicht geplant werden',
    },

    worker: {
      generatedTitle: 'Autopilot: Pin erstellt',
      generatedDesc: '{count} Pin(s) erstellt und gemäß deinen Zeiten geplant.',
      publishedTitle: 'Pins veröffentlicht!',
      publishedDesc: '{count} Pin(s) auf Pinterest veröffentlicht',
      publishFailedTitle: 'Fehler beim Veröffentlichen',
      publishFailedDesc: '{count} Pin(s) konnten nicht veröffentlicht werden',
    },
  },
};
