import type { AppLocale } from '../types';

export interface GeneratorNicheLabels {
  decoration: string;
  fashion: string;
  cooking: string;
  travel: string;
  fitness: string;
  diy: string;
  technology: string;
  business: string;
  art: string;
  photography: string;
}

export interface GeneratorToneLabels {
  professional: string;
  casual: string;
  inspiring: string;
  educational: string;
  funny: string;
}

export interface GeneratorDictionary {
  pageTitle: string;
  pageSubtitle: string;

  niches: GeneratorNicheLabels;
  tones: GeneratorToneLabels;

  // Status banner
  generatingInProgress: string;
  similarContentTitle: string;
  similarContentHint: string;

  // Step 1 — source
  sourceCardTitle: string;
  tabAuto: string;
  tabUpload: string;
  tabUrl: string;
  businessLabel: string;
  businessPlaceholder: string;
  offerLabel: string;
  offerPlaceholder: string;
  audienceLabel: string;
  audiencePlaceholder: string;
  autoHelpBefore: string;
  autoHelpStrong: string;
  autoHelpAfter: string;
  generatedPinAlt: string;
  selectedImageAlt: string;
  removeImage: string;
  uploadPrompt: string;
  uploadHint: string;
  uploading: string;
  urlPlaceholder: string;
  urlSubmit: string;

  // Step 2 — options
  optionsCardTitle: string;
  nicheLabel: string;
  toneLabel: string;
  generateImageAndText: string;
  generateContent: string;

  // Step 3 — result
  generatedCardTitle: string;
  regenerate: string;
  emptyState: string;
  titleLabel: string;
  descriptionLabel: string;
  hashtagsLabel: string;
  altTextLabel: string;
  previewLabel: string;
  previewAlt: string;
  copy: string;
  save: string;
  schedule: string;

  // Generation steps / status messages
  stepAnalyzingImage: string;
  stepConcept: string;
  stepImage: string;
  statusGenerating: string;
  statusCreatingImage: string;
  statusSuccess: string;
  textOkImageFailed: string;

  // Toasts
  urlInvalidTitle: string;
  urlInvalidDescription: string;
  imageNotFoundTitle: string;
  imageNotFoundDescription: string;
  imageRequiredTitle: string;
  imageRequiredDescription: string;
  contentGeneratedTitle: string;
  contentGeneratedAi: string;
  contentGeneratedDemo: string;
  errorTitle: string;
  generateContentFailed: string;
  businessRequiredTitle: string;
  businessRequiredMessage: string;
  duplicateDetectedTitle: string;
  similarPinTitle: string;
  textOkImageFailedTitle: string;
  pinGeneratedTitle: string;
  pinGeneratedDescription: string;
  generationErrorTitle: string;
  copiedTitle: string;
  copiedDescription: string;
  exactDuplicateTitle: string;
  identicalPinFound: string;
  exactDuplicateDescription: string;
  pinSavedTitle: string;
  pinSavedDespiteSimilarity: string;
  pinSavedDescription: string;
  savePinFailed: string;
  pinScheduledTitle: string;
  pinScheduledDespiteSimilarity: string;
  pinScheduledDescription: string;
  schedulePinFailed: string;
}

const fr: GeneratorDictionary = {
  pageTitle: 'Générateur de Pins',
  pageSubtitle:
    "Créez des Pins optimisés avec l'aide de l'IA — image + texte selon votre business",

  niches: {
    decoration: 'Décoration',
    fashion: 'Mode',
    cooking: 'Cuisine',
    travel: 'Voyage',
    fitness: 'Fitness',
    diy: 'DIY',
    technology: 'Technologie',
    business: 'Business',
    art: 'Art',
    photography: 'Photographie',
  },
  tones: {
    professional: 'Professionnel',
    casual: 'Décontracté',
    inspiring: 'Inspirant',
    educational: 'Éducatif',
    funny: 'Humoristique',
  },

  generatingInProgress: 'Génération en cours…',
  similarContentTitle: 'Contenu similaire détecté',
  similarContentHint:
    'Vous pouvez régénérer pour une variante différente ou continuer pour sauvegarder ce contenu.',

  sourceCardTitle: '1. Source du Pin',
  tabAuto: 'Auto',
  tabUpload: 'Upload',
  tabUrl: 'URL',
  businessLabel: 'Votre business *',
  businessPlaceholder:
    'Ex. Boutique de décoration bohème pour petits appartements, style naturel et cosy…',
  offerLabel: 'Produit / offre (optionnel)',
  offerPlaceholder: 'Ex. Kit déco murale, coaching 1:1, ebook…',
  audienceLabel: 'Audience (optionnel)',
  audiencePlaceholder: 'Ex. Femmes 25-40 ans, primo-accédants…',
  autoHelpBefore: "L'IA génère une ",
  autoHelpStrong: 'nouvelle image',
  autoHelpAfter:
    ' (Grok, format vertical avec titre lisible) et le texte du Pin. Chaque génération produit une variante différente.',
  generatedPinAlt: 'Pin généré',
  selectedImageAlt: 'Image sélectionnée',
  removeImage: "Retirer l'image",
  uploadPrompt: 'Cliquez pour télécharger une image',
  uploadHint: "PNG, JPG, GIF jusqu'à 10MB",
  uploading: 'Téléchargement... {percent}%',
  urlPlaceholder: 'https://exemple.com/image.jpg',
  urlSubmit: 'OK',

  optionsCardTitle: '2. Options de génération',
  nicheLabel: 'Niche (optionnel)',
  toneLabel: 'Ton (optionnel)',
  generateImageAndText: 'Générer image + texte',
  generateContent: 'Générer le contenu',

  generatedCardTitle: '3. Contenu généré',
  regenerate: 'Régénérer',
  emptyState:
    'Mode Auto : décrivez votre business pour générer image + texte. Ou uploadez une image pour générer uniquement le texte.',
  titleLabel: 'Titre',
  descriptionLabel: 'Description',
  hashtagsLabel: 'Hashtags',
  altTextLabel: 'Texte alternatif (SEO)',
  previewLabel: 'Aperçu du Pin',
  previewAlt: 'Aperçu',
  copy: 'Copier',
  save: 'Sauvegarder',
  schedule: 'Planifier',

  stepAnalyzingImage: "Analyse de l'image et rédaction…",
  stepConcept: '1/2 Conception du Pin…',
  stepImage: "2/2 Génération de l'image (Grok)…",
  statusGenerating: 'Génération en cours (texte + image, ~20–60 s)…',
  statusCreatingImage: "Création de l'image avec Grok…",
  statusSuccess: 'Pin généré avec succès.',
  textOkImageFailed: "Texte généré, mais l'image a échoué : {error}",

  urlInvalidTitle: 'URL invalide',
  urlInvalidDescription: "L'URL doit commencer par http:// ou https://",
  imageNotFoundTitle: 'Image introuvable',
  imageNotFoundDescription:
    "Cette URL ne pointe pas vers une image. Utilisez le lien direct d'une image (se terminant par .jpg, .png…), pas celui d'une page web.",
  imageRequiredTitle: 'Image requise',
  imageRequiredDescription: "Veuillez d'abord télécharger ou entrer une image.",
  contentGeneratedTitle: 'Contenu généré !',
  contentGeneratedAi: 'Contenu créé par l’IA à partir de votre image.',
  contentGeneratedDemo: 'Mode démo : contenu simulé.',
  errorTitle: 'Erreur',
  generateContentFailed: 'Impossible de générer le contenu. Réessayez.',
  businessRequiredTitle: 'Business requis',
  businessRequiredMessage:
    'Décrivez votre activité dans le champ « Votre business » pour générer un Pin.',
  duplicateDetectedTitle: 'Doublon détecté !',
  similarPinTitle: 'Pin similaire trouvé',
  textOkImageFailedTitle: 'Texte OK — image en échec',
  pinGeneratedTitle: 'Pin généré !',
  pinGeneratedDescription:
    'Image + texte créés pour votre business. Cliquez sur Régénérer pour une autre variante.',
  generationErrorTitle: 'Erreur de génération',
  copiedTitle: 'Copié !',
  copiedDescription: 'Le texte a été copié dans le presse-papiers.',
  exactDuplicateTitle: 'Doublon exact détecté',
  identicalPinFound: 'Pin identique trouvé',
  exactDuplicateDescription: '{message}. Modifiez le titre ou régénérez.',
  pinSavedTitle: 'Pin sauvegardé !',
  pinSavedDespiteSimilarity: 'Pin sauvegardé malgré la similarité avec un pin existant.',
  pinSavedDescription: 'Votre Pin a été ajouté aux brouillons.',
  savePinFailed: 'Impossible de sauvegarder le pin.',
  pinScheduledTitle: 'Pin planifié !',
  pinScheduledDespiteSimilarity: 'Pin planifié malgré la similarité avec un pin existant.',
  pinScheduledDescription:
    'Votre Pin sera publié dans 1 heure. Modifiez la date depuis la planification.',
  schedulePinFailed: 'Impossible de planifier le pin.',
};

const en: GeneratorDictionary = {
  pageTitle: 'Pin Generator',
  pageSubtitle: 'Create optimized Pins with the help of AI — image + text tailored to your business',

  niches: {
    decoration: 'Home decor',
    fashion: 'Fashion',
    cooking: 'Cooking',
    travel: 'Travel',
    fitness: 'Fitness',
    diy: 'DIY',
    technology: 'Technology',
    business: 'Business',
    art: 'Art',
    photography: 'Photography',
  },
  tones: {
    professional: 'Professional',
    casual: 'Casual',
    inspiring: 'Inspiring',
    educational: 'Educational',
    funny: 'Humorous',
  },

  generatingInProgress: 'Generating…',
  similarContentTitle: 'Similar content detected',
  similarContentHint:
    'You can regenerate for a different variant or continue to save this content.',

  sourceCardTitle: '1. Pin source',
  tabAuto: 'Auto',
  tabUpload: 'Upload',
  tabUrl: 'URL',
  businessLabel: 'Your business *',
  businessPlaceholder:
    'E.g. Boho home decor shop for small apartments, natural and cozy style…',
  offerLabel: 'Product / offer (optional)',
  offerPlaceholder: 'E.g. Wall decor kit, 1:1 coaching, ebook…',
  audienceLabel: 'Audience (optional)',
  audiencePlaceholder: 'E.g. Women aged 25-40, first-time buyers…',
  autoHelpBefore: 'The AI generates a ',
  autoHelpStrong: 'brand-new image',
  autoHelpAfter:
    ' (Grok, vertical format with a readable title) plus the Pin copy. Every generation produces a different variant.',
  generatedPinAlt: 'Generated Pin',
  selectedImageAlt: 'Selected image',
  removeImage: 'Remove image',
  uploadPrompt: 'Click to upload an image',
  uploadHint: 'PNG, JPG, GIF up to 10MB',
  uploading: 'Uploading... {percent}%',
  urlPlaceholder: 'https://example.com/image.jpg',
  urlSubmit: 'OK',

  optionsCardTitle: '2. Generation options',
  nicheLabel: 'Niche (optional)',
  toneLabel: 'Tone (optional)',
  generateImageAndText: 'Generate image + text',
  generateContent: 'Generate content',

  generatedCardTitle: '3. Generated content',
  regenerate: 'Regenerate',
  emptyState:
    'Auto mode: describe your business to generate image + text. Or upload an image to generate the text only.',
  titleLabel: 'Title',
  descriptionLabel: 'Description',
  hashtagsLabel: 'Hashtags',
  altTextLabel: 'Alt text (SEO)',
  previewLabel: 'Pin preview',
  previewAlt: 'Preview',
  copy: 'Copy',
  save: 'Save',
  schedule: 'Schedule',

  stepAnalyzingImage: 'Analyzing the image and writing…',
  stepConcept: '1/2 Designing the Pin…',
  stepImage: '2/2 Generating the image (Grok)…',
  statusGenerating: 'Generation in progress (text + image, ~20–60 s)…',
  statusCreatingImage: 'Creating the image with Grok…',
  statusSuccess: 'Pin generated successfully.',
  textOkImageFailed: 'Text generated, but the image failed: {error}',

  urlInvalidTitle: 'Invalid URL',
  urlInvalidDescription: 'The URL must start with http:// or https://',
  imageNotFoundTitle: 'Image not found',
  imageNotFoundDescription:
    'This URL does not point to an image. Use the direct link to an image (ending in .jpg, .png…), not the link to a web page.',
  imageRequiredTitle: 'Image required',
  imageRequiredDescription: 'Please upload or enter an image first.',
  contentGeneratedTitle: 'Content generated!',
  contentGeneratedAi: 'Content created by AI from your image.',
  contentGeneratedDemo: 'Demo mode: simulated content.',
  errorTitle: 'Error',
  generateContentFailed: 'Unable to generate the content. Please try again.',
  businessRequiredTitle: 'Business required',
  businessRequiredMessage:
    'Describe your activity in the "Your business" field to generate a Pin.',
  duplicateDetectedTitle: 'Duplicate detected!',
  similarPinTitle: 'Similar Pin found',
  textOkImageFailedTitle: 'Text OK — image failed',
  pinGeneratedTitle: 'Pin generated!',
  pinGeneratedDescription:
    'Image + text created for your business. Click Regenerate for another variant.',
  generationErrorTitle: 'Generation error',
  copiedTitle: 'Copied!',
  copiedDescription: 'The text has been copied to the clipboard.',
  exactDuplicateTitle: 'Exact duplicate detected',
  identicalPinFound: 'Identical Pin found',
  exactDuplicateDescription: '{message}. Change the title or regenerate.',
  pinSavedTitle: 'Pin saved!',
  pinSavedDespiteSimilarity: 'Pin saved despite its similarity to an existing Pin.',
  pinSavedDescription: 'Your Pin has been added to drafts.',
  savePinFailed: 'Unable to save the Pin.',
  pinScheduledTitle: 'Pin scheduled!',
  pinScheduledDespiteSimilarity: 'Pin scheduled despite its similarity to an existing Pin.',
  pinScheduledDescription:
    'Your Pin will be published in 1 hour. Change the date from the schedule page.',
  schedulePinFailed: 'Unable to schedule the Pin.',
};

const es: GeneratorDictionary = {
  pageTitle: 'Generador de Pins',
  pageSubtitle:
    'Crea Pins optimizados con la ayuda de la IA — imagen + texto según tu negocio',

  niches: {
    decoration: 'Decoración',
    fashion: 'Moda',
    cooking: 'Cocina',
    travel: 'Viajes',
    fitness: 'Fitness',
    diy: 'DIY',
    technology: 'Tecnología',
    business: 'Negocios',
    art: 'Arte',
    photography: 'Fotografía',
  },
  tones: {
    professional: 'Profesional',
    casual: 'Informal',
    inspiring: 'Inspirador',
    educational: 'Educativo',
    funny: 'Humorístico',
  },

  generatingInProgress: 'Generando…',
  similarContentTitle: 'Contenido similar detectado',
  similarContentHint:
    'Puedes regenerar para obtener otra variante o continuar para guardar este contenido.',

  sourceCardTitle: '1. Fuente del Pin',
  tabAuto: 'Auto',
  tabUpload: 'Subir',
  tabUrl: 'URL',
  businessLabel: 'Tu negocio *',
  businessPlaceholder:
    'Ej. Tienda de decoración bohemia para pisos pequeños, estilo natural y acogedor…',
  offerLabel: 'Producto / oferta (opcional)',
  offerPlaceholder: 'Ej. Kit de decoración de pared, coaching 1:1, ebook…',
  audienceLabel: 'Audiencia (opcional)',
  audiencePlaceholder: 'Ej. Mujeres de 25-40 años, compradores de primera vivienda…',
  autoHelpBefore: 'La IA genera una ',
  autoHelpStrong: 'imagen nueva',
  autoHelpAfter:
    ' (Grok, formato vertical con título legible) y el texto del Pin. Cada generación produce una variante diferente.',
  generatedPinAlt: 'Pin generado',
  selectedImageAlt: 'Imagen seleccionada',
  removeImage: 'Quitar la imagen',
  uploadPrompt: 'Haz clic para subir una imagen',
  uploadHint: 'PNG, JPG, GIF hasta 10MB',
  uploading: 'Subiendo... {percent}%',
  urlPlaceholder: 'https://ejemplo.com/imagen.jpg',
  urlSubmit: 'OK',

  optionsCardTitle: '2. Opciones de generación',
  nicheLabel: 'Nicho (opcional)',
  toneLabel: 'Tono (opcional)',
  generateImageAndText: 'Generar imagen + texto',
  generateContent: 'Generar el contenido',

  generatedCardTitle: '3. Contenido generado',
  regenerate: 'Regenerar',
  emptyState:
    'Modo Auto: describe tu negocio para generar imagen + texto. O sube una imagen para generar solo el texto.',
  titleLabel: 'Título',
  descriptionLabel: 'Descripción',
  hashtagsLabel: 'Hashtags',
  altTextLabel: 'Texto alternativo (SEO)',
  previewLabel: 'Vista previa del Pin',
  previewAlt: 'Vista previa',
  copy: 'Copiar',
  save: 'Guardar',
  schedule: 'Programar',

  stepAnalyzingImage: 'Analizando la imagen y redactando…',
  stepConcept: '1/2 Diseñando el Pin…',
  stepImage: '2/2 Generando la imagen (Grok)…',
  statusGenerating: 'Generación en curso (texto + imagen, ~20–60 s)…',
  statusCreatingImage: 'Creando la imagen con Grok…',
  statusSuccess: 'Pin generado con éxito.',
  textOkImageFailed: 'Texto generado, pero la imagen falló: {error}',

  urlInvalidTitle: 'URL no válida',
  urlInvalidDescription: 'La URL debe empezar por http:// o https://',
  imageNotFoundTitle: 'Imagen no encontrada',
  imageNotFoundDescription:
    'Esta URL no apunta a una imagen. Usa el enlace directo de una imagen (que termine en .jpg, .png…), no el de una página web.',
  imageRequiredTitle: 'Imagen requerida',
  imageRequiredDescription: 'Primero sube o introduce una imagen.',
  contentGeneratedTitle: '¡Contenido generado!',
  contentGeneratedAi: 'Contenido creado por la IA a partir de tu imagen.',
  contentGeneratedDemo: 'Modo demo: contenido simulado.',
  errorTitle: 'Error',
  generateContentFailed: 'No se pudo generar el contenido. Inténtalo de nuevo.',
  businessRequiredTitle: 'Negocio requerido',
  businessRequiredMessage:
    'Describe tu actividad en el campo «Tu negocio» para generar un Pin.',
  duplicateDetectedTitle: '¡Duplicado detectado!',
  similarPinTitle: 'Pin similar encontrado',
  textOkImageFailedTitle: 'Texto OK — imagen fallida',
  pinGeneratedTitle: '¡Pin generado!',
  pinGeneratedDescription:
    'Imagen + texto creados para tu negocio. Haz clic en Regenerar para otra variante.',
  generationErrorTitle: 'Error de generación',
  copiedTitle: '¡Copiado!',
  copiedDescription: 'El texto se ha copiado al portapapeles.',
  exactDuplicateTitle: 'Duplicado exacto detectado',
  identicalPinFound: 'Pin idéntico encontrado',
  exactDuplicateDescription: '{message}. Modifica el título o regenera.',
  pinSavedTitle: '¡Pin guardado!',
  pinSavedDespiteSimilarity: 'Pin guardado a pesar de su similitud con un Pin existente.',
  pinSavedDescription: 'Tu Pin se ha añadido a los borradores.',
  savePinFailed: 'No se pudo guardar el Pin.',
  pinScheduledTitle: '¡Pin programado!',
  pinScheduledDespiteSimilarity: 'Pin programado a pesar de su similitud con un Pin existente.',
  pinScheduledDescription:
    'Tu Pin se publicará en 1 hora. Modifica la fecha desde la programación.',
  schedulePinFailed: 'No se pudo programar el Pin.',
};

const de: GeneratorDictionary = {
  pageTitle: 'Pin-Generator',
  pageSubtitle:
    'Erstelle optimierte Pins mit Hilfe der KI — Bild + Text passend zu deinem Business',

  niches: {
    decoration: 'Dekoration',
    fashion: 'Mode',
    cooking: 'Kochen',
    travel: 'Reisen',
    fitness: 'Fitness',
    diy: 'DIY',
    technology: 'Technologie',
    business: 'Business',
    art: 'Kunst',
    photography: 'Fotografie',
  },
  tones: {
    professional: 'Professionell',
    casual: 'Locker',
    inspiring: 'Inspirierend',
    educational: 'Lehrreich',
    funny: 'Humorvoll',
  },

  generatingInProgress: 'Wird generiert…',
  similarContentTitle: 'Ähnlicher Inhalt erkannt',
  similarContentHint:
    'Du kannst für eine andere Variante neu generieren oder fortfahren, um diesen Inhalt zu speichern.',

  sourceCardTitle: '1. Quelle des Pins',
  tabAuto: 'Auto',
  tabUpload: 'Upload',
  tabUrl: 'URL',
  businessLabel: 'Dein Business *',
  businessPlaceholder:
    'z. B. Boho-Dekoshop für kleine Wohnungen, natürlicher und gemütlicher Stil…',
  offerLabel: 'Produkt / Angebot (optional)',
  offerPlaceholder: 'z. B. Wanddeko-Set, 1:1-Coaching, E-Book…',
  audienceLabel: 'Zielgruppe (optional)',
  audiencePlaceholder: 'z. B. Frauen 25-40 Jahre, Erstkäufer…',
  autoHelpBefore: 'Die KI erstellt ein ',
  autoHelpStrong: 'neues Bild',
  autoHelpAfter:
    ' (Grok, Hochformat mit gut lesbarem Titel) sowie den Text des Pins. Jede Generierung liefert eine andere Variante.',
  generatedPinAlt: 'Generierter Pin',
  selectedImageAlt: 'Ausgewähltes Bild',
  removeImage: 'Bild entfernen',
  uploadPrompt: 'Klicke, um ein Bild hochzuladen',
  uploadHint: 'PNG, JPG, GIF bis zu 10MB',
  uploading: 'Wird hochgeladen... {percent}%',
  urlPlaceholder: 'https://beispiel.de/bild.jpg',
  urlSubmit: 'OK',

  optionsCardTitle: '2. Generierungsoptionen',
  nicheLabel: 'Nische (optional)',
  toneLabel: 'Tonalität (optional)',
  generateImageAndText: 'Bild + Text generieren',
  generateContent: 'Inhalt generieren',

  generatedCardTitle: '3. Generierter Inhalt',
  regenerate: 'Neu generieren',
  emptyState:
    'Auto-Modus: Beschreibe dein Business, um Bild + Text zu generieren. Oder lade ein Bild hoch, um nur den Text zu generieren.',
  titleLabel: 'Titel',
  descriptionLabel: 'Beschreibung',
  hashtagsLabel: 'Hashtags',
  altTextLabel: 'Alternativtext (SEO)',
  previewLabel: 'Pin-Vorschau',
  previewAlt: 'Vorschau',
  copy: 'Kopieren',
  save: 'Speichern',
  schedule: 'Planen',

  stepAnalyzingImage: 'Bild wird analysiert und Text verfasst…',
  stepConcept: '1/2 Pin wird konzipiert…',
  stepImage: '2/2 Bild wird generiert (Grok)…',
  statusGenerating: 'Generierung läuft (Text + Bild, ~20–60 s)…',
  statusCreatingImage: 'Bild wird mit Grok erstellt…',
  statusSuccess: 'Pin erfolgreich generiert.',
  textOkImageFailed: 'Text generiert, aber das Bild ist fehlgeschlagen: {error}',

  urlInvalidTitle: 'Ungültige URL',
  urlInvalidDescription: 'Die URL muss mit http:// oder https:// beginnen',
  imageNotFoundTitle: 'Bild nicht gefunden',
  imageNotFoundDescription:
    'Diese URL verweist nicht auf ein Bild. Verwende den direkten Link zu einem Bild (endet auf .jpg, .png…), nicht den Link zu einer Webseite.',
  imageRequiredTitle: 'Bild erforderlich',
  imageRequiredDescription: 'Bitte lade zuerst ein Bild hoch oder gib eine Bild-URL ein.',
  contentGeneratedTitle: 'Inhalt generiert!',
  contentGeneratedAi: 'Inhalt von der KI aus deinem Bild erstellt.',
  contentGeneratedDemo: 'Demo-Modus: simulierter Inhalt.',
  errorTitle: 'Fehler',
  generateContentFailed: 'Der Inhalt konnte nicht generiert werden. Versuche es erneut.',
  businessRequiredTitle: 'Business erforderlich',
  businessRequiredMessage:
    'Beschreibe deine Tätigkeit im Feld „Dein Business“, um einen Pin zu generieren.',
  duplicateDetectedTitle: 'Duplikat erkannt!',
  similarPinTitle: 'Ähnlicher Pin gefunden',
  textOkImageFailedTitle: 'Text OK — Bild fehlgeschlagen',
  pinGeneratedTitle: 'Pin generiert!',
  pinGeneratedDescription:
    'Bild + Text für dein Business erstellt. Klicke auf „Neu generieren“ für eine andere Variante.',
  generationErrorTitle: 'Fehler bei der Generierung',
  copiedTitle: 'Kopiert!',
  copiedDescription: 'Der Text wurde in die Zwischenablage kopiert.',
  exactDuplicateTitle: 'Exaktes Duplikat erkannt',
  identicalPinFound: 'Identischer Pin gefunden',
  exactDuplicateDescription: '{message}. Ändere den Titel oder generiere neu.',
  pinSavedTitle: 'Pin gespeichert!',
  pinSavedDespiteSimilarity: 'Pin trotz Ähnlichkeit mit einem bestehenden Pin gespeichert.',
  pinSavedDescription: 'Dein Pin wurde zu den Entwürfen hinzugefügt.',
  savePinFailed: 'Der Pin konnte nicht gespeichert werden.',
  pinScheduledTitle: 'Pin geplant!',
  pinScheduledDespiteSimilarity: 'Pin trotz Ähnlichkeit mit einem bestehenden Pin geplant.',
  pinScheduledDescription:
    'Dein Pin wird in 1 Stunde veröffentlicht. Ändere das Datum in der Planung.',
  schedulePinFailed: 'Der Pin konnte nicht geplant werden.',
};

export const generator: Record<AppLocale, GeneratorDictionary> = { fr, en, es, de };
