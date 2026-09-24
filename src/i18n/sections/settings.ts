import type { AppLocale } from '../types';

export interface SettingsDictionary {
  // Header & tabs
  title: string;
  subtitle: string;
  tabProfile: string;
  tabAccount: string;
  tabNotifications: string;
  tabBilling: string;

  // Profile tab
  photoTitle: string;
  photoDesc: string;
  changePhoto: string;
  deletePhotoAria: string;
  delete: string;
  photoHint: string;
  personalInfoTitle: string;
  personalInfoDesc: string;
  firstName: string;
  lastName: string;
  email: string;
  emailHint: string;
  bio: string;
  bioPlaceholder: string;
  save: string;
  saving: string;

  // Account tab – Pinterest
  pinterestAccountsTitle: string;
  pinterestAccountsDesc: string;
  connecting: string;
  connectingShort: string;
  noPinterestAccounts: string;
  connectedOn: string;
  boardsCount: string;
  disconnect: string;
  connectFirstAccount: string;
  connectAnotherAccount: string;

  // Account tab – password
  changePasswordTitle: string;
  changePasswordDesc: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  update: string;
  updating: string;

  // Notifications tab
  notificationsTitle: string;
  notificationsDesc: string;
  notifPinsPublishedTitle: string;
  notifPinsPublishedDesc: string;
  notifWeeklyReportsTitle: string;
  notifWeeklyReportsDesc: string;
  notifNewFeaturesTitle: string;
  notifNewFeaturesDesc: string;
  notifTipsTitle: string;
  notifTipsDesc: string;

  // Billing tab
  currentPlanTitle: string;
  billingStripeReadyDesc: string;
  billingStripeNotReadyDesc: string;
  active: string;
  planPricePro: string;
  planPriceBusiness: string;
  upgrade: string;
  includedInPlan: string;
  features: {
    starterPins: string;
    starterAccounts: string;
    basicTemplates: string;
    basicAnalytics: string;
    proPins: string;
    proAccounts: string;
    premiumTemplates: string;
    aiGeneration: string;
    advancedAnalytics: string;
    prioritySupport: string;
    unlimitedPins: string;
    businessAccounts: string;
    automationApi: string;
    advancedAi: string;
    dedicatedSupport: string;
    teamCollaboration: string;
  };
  switchToBusiness: string;
  switchToPro: string;
  cancelSubscription: string;
  switchToBusinessWithPrice: string;

  // Toasts – Pinterest OAuth
  oauthCanceledTitle: string;
  oauthInvalidTitle: string;
  oauthInvalidDesc: string;
  finalizingConnection: string;
  redirectingToPinterest: string;
  pinterestConnectedTitle: string;
  pinterestConnectedDesc: string;
  pinterestConnectFailedTitle: string;
  pinterestConnectFailedDesc: string;
  demoConnectedTitle: string;
  demoConnectedDesc: string;
  connectFailedDesc: string;
  disconnectFailedDesc: string;
  accountDisconnectedTitle: string;

  // Toasts – profile & photo
  errorTitle: string;
  nameRequiredTitle: string;
  nameRequiredDesc: string;
  profileSavedTitle: string;
  profileSavedDesc: string;
  photoNotSavedTitle: string;
  photoUpdatedTitle: string;
  photoFailedTitle: string;
  photoFailedDesc: string;
  photoDeletedTitle: string;

  // Toasts – password
  missingFieldsTitle: string;
  missingFieldsDesc: string;
  passwordTooShortTitle: string;
  passwordTooShortDesc: string;
  passwordMismatchTitle: string;
  passwordMismatchDesc: string;
  passwordUpdatedTitle: string;
  passwordUpdatedDesc: string;
  passwordUpdatedDemoDesc: string;
  passwordChangeFailedDesc: string;

  // Toasts – billing
  paymentCanceledTitle: string;
  paymentCanceledDesc: string;
  planActivatedTitle: string;
  planActivatedExclaimTitle: string;
  paymentConfirmedDesc: string;
  paymentNotConfirmedTitle: string;
  paymentNotConfirmedDesc: string;
  checkoutFailedDesc: string;
  portalFailedDesc: string;
  planChangeFailedDesc: string;
  subscriptionCanceledTitle: string;
  subscriptionUpdatedDesc: string;
  planUpdatedNoStripeDesc: string;

  // Toasts – notifications
  notificationsSavedTitle: string;
  notificationsSavedDesc: string;
}

export const settings: Record<AppLocale, SettingsDictionary> = {
  fr: {
    title: 'Paramètres',
    subtitle: 'Gérez votre compte et vos préférences',
    tabProfile: 'Profil',
    tabAccount: 'Compte',
    tabNotifications: 'Notifications',
    tabBilling: 'Abonnement',

    photoTitle: 'Photo de profil',
    photoDesc: 'Cette photo sera visible sur votre profil public',
    changePhoto: 'Changer la photo',
    deletePhotoAria: 'Supprimer la photo',
    delete: 'Supprimer',
    photoHint: "JPG, PNG, GIF ou WebP. L'image est compressée automatiquement.",
    personalInfoTitle: 'Informations personnelles',
    personalInfoDesc: 'Mettez à jour vos informations de profil',
    firstName: 'Prénom',
    lastName: 'Nom',
    email: 'Email',
    emailHint: 'Pour changer votre email, contactez le support.',
    bio: 'Bio',
    bioPlaceholder: 'Parlez-nous de vous...',
    save: 'Sauvegarder',
    saving: 'Sauvegarde...',

    pinterestAccountsTitle: 'Comptes Pinterest connectés',
    pinterestAccountsDesc: 'Connectez vos comptes Pinterest pour publier automatiquement',
    connecting: 'Connexion en cours…',
    connectingShort: 'Connexion…',
    noPinterestAccounts: 'Aucun compte Pinterest connecté.',
    connectedOn: 'Connecté le {date}',
    boardsCount: '{count} tableau(x)',
    disconnect: 'Déconnecter',
    connectFirstAccount: 'Connecter mon compte Pinterest',
    connectAnotherAccount: 'Connecter un autre compte',

    changePasswordTitle: 'Changer le mot de passe',
    changePasswordDesc: 'Mettez à jour votre mot de passe pour plus de sécurité',
    currentPassword: 'Mot de passe actuel',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    update: 'Mettre à jour',
    updating: 'Mise à jour...',

    notificationsTitle: 'Préférences de notification',
    notificationsDesc: 'Choisissez comment vous souhaitez être notifié',
    notifPinsPublishedTitle: 'Pins publiés',
    notifPinsPublishedDesc: 'Recevez une notification quand un Pin est publié',
    notifWeeklyReportsTitle: 'Rapports hebdomadaires',
    notifWeeklyReportsDesc: 'Recevez un résumé de vos performances chaque semaine',
    notifNewFeaturesTitle: 'Nouvelles fonctionnalités',
    notifNewFeaturesDesc: 'Soyez informé des nouvelles fonctionnalités',
    notifTipsTitle: 'Conseils et astuces',
    notifTipsDesc: 'Recevez des conseils pour améliorer vos Pins',

    currentPlanTitle: 'Plan actuel',
    billingStripeReadyDesc: 'Les upgrades Pro (19€) et Business (49€) passent par Stripe Checkout.',
    billingStripeNotReadyDesc:
      'Stripe n’est pas encore configuré : les changements de plan restent locaux jusqu’à STRIPE_SECRET_KEY.',
    active: 'Actif',
    planPricePro: '19€/mois',
    planPriceBusiness: '49€/mois',
    upgrade: 'Upgrader',
    includedInPlan: 'Inclus dans votre plan:',
    features: {
      starterPins: '10 Pins par mois',
      starterAccounts: '1 compte Pinterest',
      basicTemplates: 'Templates de base',
      basicAnalytics: 'Analytics basiques',
      proPins: '100 Pins par mois',
      proAccounts: '3 comptes Pinterest',
      premiumTemplates: 'Templates premium',
      aiGeneration: 'Génération IA',
      advancedAnalytics: 'Analytics avancés',
      prioritySupport: 'Support prioritaire',
      unlimitedPins: 'Pins illimités',
      businessAccounts: '10 comptes Pinterest',
      automationApi: "API d'automatisation",
      advancedAi: 'Génération IA avancée',
      dedicatedSupport: 'Support dédié 24/7',
      teamCollaboration: "Collaboration d'équipe",
    },
    switchToBusiness: 'Passer à Business',
    switchToPro: 'Passer à Pro',
    cancelSubscription: "Annuler l'abonnement",
    switchToBusinessWithPrice: 'Passer à Business (49€/mois)',

    oauthCanceledTitle: 'Connexion Pinterest annulée',
    oauthInvalidTitle: 'Session OAuth invalide',
    oauthInvalidDesc: 'Relancez la connexion Pinterest depuis les paramètres.',
    finalizingConnection: 'Finalisation de la connexion Pinterest…',
    redirectingToPinterest: 'Redirection vers Pinterest…',
    pinterestConnectedTitle: 'Compte Pinterest connecté',
    pinterestConnectedDesc: '@{username} — {count} tableau(x) synchronisé(s).',
    pinterestConnectFailedTitle: 'Échec connexion Pinterest',
    pinterestConnectFailedDesc: 'Impossible de finaliser OAuth. Vérifiez App ID, Secret et Redirect URI.',
    demoConnectedTitle: 'Compte Pinterest connecté (démo)',
    demoConnectedDesc:
      'Compte simulé. Pour le vrai Pinterest : crée une app sur developers.pinterest.com et colle App ID + Secret ci-dessous.',
    connectFailedDesc: 'Impossible de connecter le compte.',
    disconnectFailedDesc: 'Impossible de déconnecter le compte.',
    accountDisconnectedTitle: 'Compte déconnecté',

    errorTitle: 'Erreur',
    nameRequiredTitle: 'Nom requis',
    nameRequiredDesc: 'Veuillez renseigner au moins un prénom.',
    profileSavedTitle: 'Profil sauvegardé',
    profileSavedDesc: 'Vos informations ont été mises à jour.',
    photoNotSavedTitle: 'Photo non enregistrée',
    photoUpdatedTitle: 'Photo mise à jour',
    photoFailedTitle: 'Photo impossible',
    photoFailedDesc: 'Réessayez avec une autre image.',
    photoDeletedTitle: 'Photo supprimée',

    missingFieldsTitle: 'Champs manquants',
    missingFieldsDesc: 'Remplissez tous les champs pour changer le mot de passe.',
    passwordTooShortTitle: 'Mot de passe trop court',
    passwordTooShortDesc: 'Le mot de passe doit contenir au moins {min} caractères.',
    passwordMismatchTitle: 'Confirmation incorrecte',
    passwordMismatchDesc: 'Le nouveau mot de passe et sa confirmation ne correspondent pas.',
    passwordUpdatedTitle: 'Mot de passe mis à jour',
    passwordUpdatedDesc: 'Votre mot de passe a été changé.',
    passwordUpdatedDemoDesc: 'Mode démo : changement simulé.',
    passwordChangeFailedDesc: 'Impossible de changer le mot de passe.',

    paymentCanceledTitle: 'Paiement annulé',
    paymentCanceledDesc: 'Aucun changement n’a été appliqué à votre plan.',
    planActivatedTitle: 'Plan {plan} activé',
    planActivatedExclaimTitle: 'Plan {plan} activé !',
    paymentConfirmedDesc: 'Votre paiement Stripe a bien été confirmé.',
    paymentNotConfirmedTitle: 'Paiement non confirmé',
    paymentNotConfirmedDesc: 'Réessaie depuis Facturation.',
    checkoutFailedDesc: 'Impossible de lancer le paiement.',
    portalFailedDesc: 'Impossible d’ouvrir le portail.',
    planChangeFailedDesc: 'Impossible de changer de plan.',
    subscriptionCanceledTitle: 'Abonnement annulé',
    subscriptionUpdatedDesc: 'Votre abonnement a été mis à jour.',
    planUpdatedNoStripeDesc:
      'Stripe n’est pas encore configuré : le plan a été mis à jour sans paiement.',

    notificationsSavedTitle: 'Préférences sauvegardées',
    notificationsSavedDesc: 'Vos préférences de notification ont été enregistrées.',
  },

  en: {
    title: 'Settings',
    subtitle: 'Manage your account and preferences',
    tabProfile: 'Profile',
    tabAccount: 'Account',
    tabNotifications: 'Notifications',
    tabBilling: 'Subscription',

    photoTitle: 'Profile photo',
    photoDesc: 'This photo will be visible on your public profile',
    changePhoto: 'Change photo',
    deletePhotoAria: 'Delete photo',
    delete: 'Delete',
    photoHint: 'JPG, PNG, GIF or WebP. The image is compressed automatically.',
    personalInfoTitle: 'Personal information',
    personalInfoDesc: 'Update your profile information',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email',
    emailHint: 'To change your email, contact support.',
    bio: 'Bio',
    bioPlaceholder: 'Tell us about yourself...',
    save: 'Save',
    saving: 'Saving...',

    pinterestAccountsTitle: 'Connected Pinterest accounts',
    pinterestAccountsDesc: 'Connect your Pinterest accounts to publish automatically',
    connecting: 'Connecting…',
    connectingShort: 'Connecting…',
    noPinterestAccounts: 'No Pinterest account connected.',
    connectedOn: 'Connected on {date}',
    boardsCount: '{count} board(s)',
    disconnect: 'Disconnect',
    connectFirstAccount: 'Connect my Pinterest account',
    connectAnotherAccount: 'Connect another account',

    changePasswordTitle: 'Change password',
    changePasswordDesc: 'Update your password for better security',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    update: 'Update',
    updating: 'Updating...',

    notificationsTitle: 'Notification preferences',
    notificationsDesc: 'Choose how you want to be notified',
    notifPinsPublishedTitle: 'Published Pins',
    notifPinsPublishedDesc: 'Get notified when a Pin is published',
    notifWeeklyReportsTitle: 'Weekly reports',
    notifWeeklyReportsDesc: 'Get a summary of your performance every week',
    notifNewFeaturesTitle: 'New features',
    notifNewFeaturesDesc: 'Stay informed about new features',
    notifTipsTitle: 'Tips and tricks',
    notifTipsDesc: 'Get tips to improve your Pins',

    currentPlanTitle: 'Current plan',
    billingStripeReadyDesc: 'Pro (€19) and Business (€49) upgrades go through Stripe Checkout.',
    billingStripeNotReadyDesc:
      'Stripe is not configured yet: plan changes stay local until STRIPE_SECRET_KEY is set.',
    active: 'Active',
    planPricePro: '€19/month',
    planPriceBusiness: '€49/month',
    upgrade: 'Upgrade',
    includedInPlan: 'Included in your plan:',
    features: {
      starterPins: '10 Pins per month',
      starterAccounts: '1 Pinterest account',
      basicTemplates: 'Basic templates',
      basicAnalytics: 'Basic analytics',
      proPins: '100 Pins per month',
      proAccounts: '3 Pinterest accounts',
      premiumTemplates: 'Premium templates',
      aiGeneration: 'AI generation',
      advancedAnalytics: 'Advanced analytics',
      prioritySupport: 'Priority support',
      unlimitedPins: 'Unlimited Pins',
      businessAccounts: '10 Pinterest accounts',
      automationApi: 'Automation API',
      advancedAi: 'Advanced AI generation',
      dedicatedSupport: 'Dedicated 24/7 support',
      teamCollaboration: 'Team collaboration',
    },
    switchToBusiness: 'Switch to Business',
    switchToPro: 'Switch to Pro',
    cancelSubscription: 'Cancel subscription',
    switchToBusinessWithPrice: 'Switch to Business (€49/month)',

    oauthCanceledTitle: 'Pinterest connection canceled',
    oauthInvalidTitle: 'Invalid OAuth session',
    oauthInvalidDesc: 'Restart the Pinterest connection from the settings.',
    finalizingConnection: 'Finalizing the Pinterest connection…',
    redirectingToPinterest: 'Redirecting to Pinterest…',
    pinterestConnectedTitle: 'Pinterest account connected',
    pinterestConnectedDesc: '@{username} — {count} board(s) synced.',
    pinterestConnectFailedTitle: 'Pinterest connection failed',
    pinterestConnectFailedDesc: 'Could not complete OAuth. Check the App ID, Secret and Redirect URI.',
    demoConnectedTitle: 'Pinterest account connected (demo)',
    demoConnectedDesc:
      'Simulated account. For the real Pinterest: create an app on developers.pinterest.com and paste the App ID + Secret below.',
    connectFailedDesc: 'Could not connect the account.',
    disconnectFailedDesc: 'Could not disconnect the account.',
    accountDisconnectedTitle: 'Account disconnected',

    errorTitle: 'Error',
    nameRequiredTitle: 'Name required',
    nameRequiredDesc: 'Please enter at least a first name.',
    profileSavedTitle: 'Profile saved',
    profileSavedDesc: 'Your information has been updated.',
    photoNotSavedTitle: 'Photo not saved',
    photoUpdatedTitle: 'Photo updated',
    photoFailedTitle: 'Photo failed',
    photoFailedDesc: 'Try again with another image.',
    photoDeletedTitle: 'Photo deleted',

    missingFieldsTitle: 'Missing fields',
    missingFieldsDesc: 'Fill in all fields to change your password.',
    passwordTooShortTitle: 'Password too short',
    passwordTooShortDesc: 'The password must contain at least {min} characters.',
    passwordMismatchTitle: 'Confirmation mismatch',
    passwordMismatchDesc: 'The new password and its confirmation do not match.',
    passwordUpdatedTitle: 'Password updated',
    passwordUpdatedDesc: 'Your password has been changed.',
    passwordUpdatedDemoDesc: 'Demo mode: simulated change.',
    passwordChangeFailedDesc: 'Could not change the password.',

    paymentCanceledTitle: 'Payment canceled',
    paymentCanceledDesc: 'No changes were applied to your plan.',
    planActivatedTitle: '{plan} plan activated',
    planActivatedExclaimTitle: '{plan} plan activated!',
    paymentConfirmedDesc: 'Your Stripe payment has been confirmed.',
    paymentNotConfirmedTitle: 'Payment not confirmed',
    paymentNotConfirmedDesc: 'Try again from Billing.',
    checkoutFailedDesc: 'Could not start the payment.',
    portalFailedDesc: 'Could not open the portal.',
    planChangeFailedDesc: 'Could not change the plan.',
    subscriptionCanceledTitle: 'Subscription canceled',
    subscriptionUpdatedDesc: 'Your subscription has been updated.',
    planUpdatedNoStripeDesc: 'Stripe is not configured yet: the plan was updated without payment.',

    notificationsSavedTitle: 'Preferences saved',
    notificationsSavedDesc: 'Your notification preferences have been saved.',
  },

  es: {
    title: 'Ajustes',
    subtitle: 'Gestiona tu cuenta y tus preferencias',
    tabProfile: 'Perfil',
    tabAccount: 'Cuenta',
    tabNotifications: 'Notificaciones',
    tabBilling: 'Suscripción',

    photoTitle: 'Foto de perfil',
    photoDesc: 'Esta foto será visible en tu perfil público',
    changePhoto: 'Cambiar foto',
    deletePhotoAria: 'Eliminar foto',
    delete: 'Eliminar',
    photoHint: 'JPG, PNG, GIF o WebP. La imagen se comprime automáticamente.',
    personalInfoTitle: 'Información personal',
    personalInfoDesc: 'Actualiza la información de tu perfil',
    firstName: 'Nombre',
    lastName: 'Apellido',
    email: 'Email',
    emailHint: 'Para cambiar tu email, contacta con soporte.',
    bio: 'Bio',
    bioPlaceholder: 'Cuéntanos sobre ti...',
    save: 'Guardar',
    saving: 'Guardando...',

    pinterestAccountsTitle: 'Cuentas de Pinterest conectadas',
    pinterestAccountsDesc: 'Conecta tus cuentas de Pinterest para publicar automáticamente',
    connecting: 'Conectando…',
    connectingShort: 'Conectando…',
    noPinterestAccounts: 'Ninguna cuenta de Pinterest conectada.',
    connectedOn: 'Conectada el {date}',
    boardsCount: '{count} tablero(s)',
    disconnect: 'Desconectar',
    connectFirstAccount: 'Conectar mi cuenta de Pinterest',
    connectAnotherAccount: 'Conectar otra cuenta',

    changePasswordTitle: 'Cambiar contraseña',
    changePasswordDesc: 'Actualiza tu contraseña para más seguridad',
    currentPassword: 'Contraseña actual',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    update: 'Actualizar',
    updating: 'Actualizando...',

    notificationsTitle: 'Preferencias de notificación',
    notificationsDesc: 'Elige cómo quieres recibir las notificaciones',
    notifPinsPublishedTitle: 'Pines publicados',
    notifPinsPublishedDesc: 'Recibe una notificación cuando se publique un Pin',
    notifWeeklyReportsTitle: 'Informes semanales',
    notifWeeklyReportsDesc: 'Recibe un resumen de tu rendimiento cada semana',
    notifNewFeaturesTitle: 'Nuevas funciones',
    notifNewFeaturesDesc: 'Mantente al día de las nuevas funciones',
    notifTipsTitle: 'Consejos y trucos',
    notifTipsDesc: 'Recibe consejos para mejorar tus Pines',

    currentPlanTitle: 'Plan actual',
    billingStripeReadyDesc: 'Las mejoras a Pro (19€) y Business (49€) pasan por Stripe Checkout.',
    billingStripeNotReadyDesc:
      'Stripe aún no está configurado: los cambios de plan se quedan en local hasta definir STRIPE_SECRET_KEY.',
    active: 'Activo',
    planPricePro: '19€/mes',
    planPriceBusiness: '49€/mes',
    upgrade: 'Mejorar plan',
    includedInPlan: 'Incluido en tu plan:',
    features: {
      starterPins: '10 Pines al mes',
      starterAccounts: '1 cuenta de Pinterest',
      basicTemplates: 'Plantillas básicas',
      basicAnalytics: 'Analíticas básicas',
      proPins: '100 Pines al mes',
      proAccounts: '3 cuentas de Pinterest',
      premiumTemplates: 'Plantillas premium',
      aiGeneration: 'Generación con IA',
      advancedAnalytics: 'Analíticas avanzadas',
      prioritySupport: 'Soporte prioritario',
      unlimitedPins: 'Pines ilimitados',
      businessAccounts: '10 cuentas de Pinterest',
      automationApi: 'API de automatización',
      advancedAi: 'Generación con IA avanzada',
      dedicatedSupport: 'Soporte dedicado 24/7',
      teamCollaboration: 'Colaboración en equipo',
    },
    switchToBusiness: 'Pasar a Business',
    switchToPro: 'Pasar a Pro',
    cancelSubscription: 'Cancelar suscripción',
    switchToBusinessWithPrice: 'Pasar a Business (49€/mes)',

    oauthCanceledTitle: 'Conexión con Pinterest cancelada',
    oauthInvalidTitle: 'Sesión OAuth no válida',
    oauthInvalidDesc: 'Vuelve a iniciar la conexión con Pinterest desde los ajustes.',
    finalizingConnection: 'Finalizando la conexión con Pinterest…',
    redirectingToPinterest: 'Redirigiendo a Pinterest…',
    pinterestConnectedTitle: 'Cuenta de Pinterest conectada',
    pinterestConnectedDesc: '@{username} — {count} tablero(s) sincronizado(s).',
    pinterestConnectFailedTitle: 'Error al conectar con Pinterest',
    pinterestConnectFailedDesc: 'No se pudo completar OAuth. Comprueba el App ID, el Secret y la Redirect URI.',
    demoConnectedTitle: 'Cuenta de Pinterest conectada (demo)',
    demoConnectedDesc:
      'Cuenta simulada. Para el Pinterest real: crea una app en developers.pinterest.com y pega el App ID + Secret abajo.',
    connectFailedDesc: 'No se pudo conectar la cuenta.',
    disconnectFailedDesc: 'No se pudo desconectar la cuenta.',
    accountDisconnectedTitle: 'Cuenta desconectada',

    errorTitle: 'Error',
    nameRequiredTitle: 'Nombre obligatorio',
    nameRequiredDesc: 'Introduce al menos un nombre.',
    profileSavedTitle: 'Perfil guardado',
    profileSavedDesc: 'Tu información se ha actualizado.',
    photoNotSavedTitle: 'Foto no guardada',
    photoUpdatedTitle: 'Foto actualizada',
    photoFailedTitle: 'No se pudo subir la foto',
    photoFailedDesc: 'Inténtalo de nuevo con otra imagen.',
    photoDeletedTitle: 'Foto eliminada',

    missingFieldsTitle: 'Campos incompletos',
    missingFieldsDesc: 'Rellena todos los campos para cambiar la contraseña.',
    passwordTooShortTitle: 'Contraseña demasiado corta',
    passwordTooShortDesc: 'La contraseña debe tener al menos {min} caracteres.',
    passwordMismatchTitle: 'Confirmación incorrecta',
    passwordMismatchDesc: 'La nueva contraseña y su confirmación no coinciden.',
    passwordUpdatedTitle: 'Contraseña actualizada',
    passwordUpdatedDesc: 'Tu contraseña se ha cambiado.',
    passwordUpdatedDemoDesc: 'Modo demo: cambio simulado.',
    passwordChangeFailedDesc: 'No se pudo cambiar la contraseña.',

    paymentCanceledTitle: 'Pago cancelado',
    paymentCanceledDesc: 'No se ha aplicado ningún cambio a tu plan.',
    planActivatedTitle: 'Plan {plan} activado',
    planActivatedExclaimTitle: '¡Plan {plan} activado!',
    paymentConfirmedDesc: 'Tu pago con Stripe se ha confirmado correctamente.',
    paymentNotConfirmedTitle: 'Pago no confirmado',
    paymentNotConfirmedDesc: 'Inténtalo de nuevo desde Facturación.',
    checkoutFailedDesc: 'No se pudo iniciar el pago.',
    portalFailedDesc: 'No se pudo abrir el portal.',
    planChangeFailedDesc: 'No se pudo cambiar de plan.',
    subscriptionCanceledTitle: 'Suscripción cancelada',
    subscriptionUpdatedDesc: 'Tu suscripción se ha actualizado.',
    planUpdatedNoStripeDesc: 'Stripe aún no está configurado: el plan se ha actualizado sin pago.',

    notificationsSavedTitle: 'Preferencias guardadas',
    notificationsSavedDesc: 'Tus preferencias de notificación se han guardado.',
  },

  de: {
    title: 'Einstellungen',
    subtitle: 'Verwalte dein Konto und deine Einstellungen',
    tabProfile: 'Profil',
    tabAccount: 'Konto',
    tabNotifications: 'Benachrichtigungen',
    tabBilling: 'Abonnement',

    photoTitle: 'Profilbild',
    photoDesc: 'Dieses Bild ist in deinem öffentlichen Profil sichtbar',
    changePhoto: 'Bild ändern',
    deletePhotoAria: 'Bild löschen',
    delete: 'Löschen',
    photoHint: 'JPG, PNG, GIF oder WebP. Das Bild wird automatisch komprimiert.',
    personalInfoTitle: 'Persönliche Angaben',
    personalInfoDesc: 'Aktualisiere deine Profilinformationen',
    firstName: 'Vorname',
    lastName: 'Nachname',
    email: 'E-Mail',
    emailHint: 'Um deine E-Mail-Adresse zu ändern, kontaktiere den Support.',
    bio: 'Bio',
    bioPlaceholder: 'Erzähl uns etwas über dich...',
    save: 'Speichern',
    saving: 'Wird gespeichert...',

    pinterestAccountsTitle: 'Verbundene Pinterest-Konten',
    pinterestAccountsDesc: 'Verbinde deine Pinterest-Konten, um automatisch zu veröffentlichen',
    connecting: 'Verbindung wird hergestellt…',
    connectingShort: 'Verbinden…',
    noPinterestAccounts: 'Kein Pinterest-Konto verbunden.',
    connectedOn: 'Verbunden am {date}',
    boardsCount: '{count} Pinnwand/Pinnwände',
    disconnect: 'Trennen',
    connectFirstAccount: 'Mein Pinterest-Konto verbinden',
    connectAnotherAccount: 'Weiteres Konto verbinden',

    changePasswordTitle: 'Passwort ändern',
    changePasswordDesc: 'Aktualisiere dein Passwort für mehr Sicherheit',
    currentPassword: 'Aktuelles Passwort',
    newPassword: 'Neues Passwort',
    confirmPassword: 'Passwort bestätigen',
    update: 'Aktualisieren',
    updating: 'Wird aktualisiert...',

    notificationsTitle: 'Benachrichtigungseinstellungen',
    notificationsDesc: 'Wähle, wie du benachrichtigt werden möchtest',
    notifPinsPublishedTitle: 'Veröffentlichte Pins',
    notifPinsPublishedDesc: 'Erhalte eine Benachrichtigung, wenn ein Pin veröffentlicht wird',
    notifWeeklyReportsTitle: 'Wöchentliche Berichte',
    notifWeeklyReportsDesc: 'Erhalte jede Woche eine Zusammenfassung deiner Performance',
    notifNewFeaturesTitle: 'Neue Funktionen',
    notifNewFeaturesDesc: 'Bleib über neue Funktionen informiert',
    notifTipsTitle: 'Tipps und Tricks',
    notifTipsDesc: 'Erhalte Tipps, um deine Pins zu verbessern',

    currentPlanTitle: 'Aktueller Plan',
    billingStripeReadyDesc: 'Upgrades auf Pro (19 €) und Business (49 €) laufen über Stripe Checkout.',
    billingStripeNotReadyDesc:
      'Stripe ist noch nicht konfiguriert: Planänderungen bleiben lokal, bis STRIPE_SECRET_KEY gesetzt ist.',
    active: 'Aktiv',
    planPricePro: '19 €/Monat',
    planPriceBusiness: '49 €/Monat',
    upgrade: 'Upgraden',
    includedInPlan: 'In deinem Plan enthalten:',
    features: {
      starterPins: '10 Pins pro Monat',
      starterAccounts: '1 Pinterest-Konto',
      basicTemplates: 'Basis-Vorlagen',
      basicAnalytics: 'Basis-Analytics',
      proPins: '100 Pins pro Monat',
      proAccounts: '3 Pinterest-Konten',
      premiumTemplates: 'Premium-Vorlagen',
      aiGeneration: 'KI-Generierung',
      advancedAnalytics: 'Erweiterte Analytics',
      prioritySupport: 'Prioritäts-Support',
      unlimitedPins: 'Unbegrenzte Pins',
      businessAccounts: '10 Pinterest-Konten',
      automationApi: 'Automatisierungs-API',
      advancedAi: 'Erweiterte KI-Generierung',
      dedicatedSupport: 'Dedizierter 24/7-Support',
      teamCollaboration: 'Team-Zusammenarbeit',
    },
    switchToBusiness: 'Zu Business wechseln',
    switchToPro: 'Zu Pro wechseln',
    cancelSubscription: 'Abonnement kündigen',
    switchToBusinessWithPrice: 'Zu Business wechseln (49 €/Monat)',

    oauthCanceledTitle: 'Pinterest-Verbindung abgebrochen',
    oauthInvalidTitle: 'Ungültige OAuth-Sitzung',
    oauthInvalidDesc: 'Starte die Pinterest-Verbindung erneut über die Einstellungen.',
    finalizingConnection: 'Pinterest-Verbindung wird abgeschlossen…',
    redirectingToPinterest: 'Weiterleitung zu Pinterest…',
    pinterestConnectedTitle: 'Pinterest-Konto verbunden',
    pinterestConnectedDesc: '@{username} — {count} Pinnwand/Pinnwände synchronisiert.',
    pinterestConnectFailedTitle: 'Pinterest-Verbindung fehlgeschlagen',
    pinterestConnectFailedDesc: 'OAuth konnte nicht abgeschlossen werden. Prüfe App ID, Secret und Redirect URI.',
    demoConnectedTitle: 'Pinterest-Konto verbunden (Demo)',
    demoConnectedDesc:
      'Simuliertes Konto. Für das echte Pinterest: Erstelle eine App auf developers.pinterest.com und füge unten App ID + Secret ein.',
    connectFailedDesc: 'Das Konto konnte nicht verbunden werden.',
    disconnectFailedDesc: 'Das Konto konnte nicht getrennt werden.',
    accountDisconnectedTitle: 'Konto getrennt',

    errorTitle: 'Fehler',
    nameRequiredTitle: 'Name erforderlich',
    nameRequiredDesc: 'Bitte gib mindestens einen Vornamen an.',
    profileSavedTitle: 'Profil gespeichert',
    profileSavedDesc: 'Deine Angaben wurden aktualisiert.',
    photoNotSavedTitle: 'Bild nicht gespeichert',
    photoUpdatedTitle: 'Bild aktualisiert',
    photoFailedTitle: 'Bild konnte nicht verwendet werden',
    photoFailedDesc: 'Versuche es mit einem anderen Bild.',
    photoDeletedTitle: 'Bild gelöscht',

    missingFieldsTitle: 'Fehlende Felder',
    missingFieldsDesc: 'Fülle alle Felder aus, um das Passwort zu ändern.',
    passwordTooShortTitle: 'Passwort zu kurz',
    passwordTooShortDesc: 'Das Passwort muss mindestens {min} Zeichen enthalten.',
    passwordMismatchTitle: 'Bestätigung stimmt nicht überein',
    passwordMismatchDesc: 'Das neue Passwort und seine Bestätigung stimmen nicht überein.',
    passwordUpdatedTitle: 'Passwort aktualisiert',
    passwordUpdatedDesc: 'Dein Passwort wurde geändert.',
    passwordUpdatedDemoDesc: 'Demo-Modus: Änderung simuliert.',
    passwordChangeFailedDesc: 'Das Passwort konnte nicht geändert werden.',

    paymentCanceledTitle: 'Zahlung abgebrochen',
    paymentCanceledDesc: 'An deinem Plan wurde nichts geändert.',
    planActivatedTitle: 'Plan {plan} aktiviert',
    planActivatedExclaimTitle: 'Plan {plan} aktiviert!',
    paymentConfirmedDesc: 'Deine Stripe-Zahlung wurde bestätigt.',
    paymentNotConfirmedTitle: 'Zahlung nicht bestätigt',
    paymentNotConfirmedDesc: 'Versuche es erneut über Abrechnung.',
    checkoutFailedDesc: 'Die Zahlung konnte nicht gestartet werden.',
    portalFailedDesc: 'Das Portal konnte nicht geöffnet werden.',
    planChangeFailedDesc: 'Der Plan konnte nicht geändert werden.',
    subscriptionCanceledTitle: 'Abonnement gekündigt',
    subscriptionUpdatedDesc: 'Dein Abonnement wurde aktualisiert.',
    planUpdatedNoStripeDesc: 'Stripe ist noch nicht konfiguriert: Der Plan wurde ohne Zahlung aktualisiert.',

    notificationsSavedTitle: 'Einstellungen gespeichert',
    notificationsSavedDesc: 'Deine Benachrichtigungseinstellungen wurden gespeichert.',
  },
};
