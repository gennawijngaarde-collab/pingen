import type { Dictionary } from '../types';

const fr: Dictionary = {
  common: {
    login: 'Se connecter',
    signup: 'Commencer gratuitement',
    logout: 'Se déconnecter',
    save: 'Enregistrer',
    cancel: 'Annuler',
    loading: 'Chargement…',
    language: 'Langue',
    seeDemo: 'Voir la démo',
    perMonth: 'mois',
    popular: 'Populaire',
    free: 'Gratuit',
  },
  nav: {
    features: 'Fonctionnalités',
    howItWorks: 'Comment ça marche',
    pricing: 'Tarifs',
    faq: 'FAQ',
  },
  sidebar: {
    dashboard: 'Tableau de bord',
    generator: 'Générateur de Pins',
    autopilot: 'Autopilote',
    schedule: 'Planification',
    analytics: 'Analytics',
    settings: 'Paramètres',
  },
  schedule: {
    title: 'Planification',
    subtitle: 'Gérez vos Pins planifiés, brouillons et publiés',
    calendar: 'Calendrier',
    legend: 'Légende',
    scheduled: 'Planifié',
    draft: 'Brouillon',
    published: 'Publié',
    failed: 'Échoué',
    noPinThatDay: 'Aucun Pin ce jour-là.',
    noScheduled: 'Aucun Pin planifié',
    noDrafts: 'Aucun brouillon',
    noPublished: 'Aucun Pin publié',
    createPin: 'Créer un Pin',
    autopilot: 'Autopilote',
    planPin: 'Planifier le Pin',
    reschedulePin: 'Replanifier le Pin',
    chooseDateTime: 'Choisissez une date et une heure de publication',
    publishTime: 'Heure de publication',
    plan: 'Planifier',
    reschedule: 'Replanifier',
    editPin: 'Modifier le Pin',
    editPinDesc: 'Modifiez le titre et la description de votre Pin',
    titleLabel: 'Titre',
    descriptionLabel: 'Description',
    modify: 'Modifier',
    cancelSchedule: 'Annuler',
    delete: 'Supprimer',
    createdOn: 'Créé le',
    publishedOn: 'Publié le',
    viewPin: 'Détail du Pin',
    hashtags: 'Hashtags',
    altText: 'Texte alternatif',
    link: 'Lien',
    copyHashtags: 'Copier les hashtags',
    close: 'Fermer',
  },
  hero: {
    titleBefore: 'Automatisez votre',
    titleHighlight: 'Pinterest',
    titleAfter: 'et boostez votre trafic',
    subtitle:
      'Créez, planifiez et publiez des Pins optimisés automatiquement. Gagnez du temps et développez votre business.',
    cta: 'Commencer gratuitement',
    login: 'Se connecter',
  },
  features: {
    badge: 'Fonctionnalités',
    title: 'Tout ce dont vous avez besoin pour réussir sur Pinterest',
    subtitle:
      'Des outils puissants et intuitifs pour créer, planifier et analyser votre contenu Pinterest comme un pro.',
    items: [
      {
        title: 'Génération IA de Pins',
        description:
          'Créez des Pins professionnels en secondes grâce à notre IA entraînée sur les meilleures pratiques Pinterest.',
      },
      {
        title: 'Planification intelligente',
        description:
          'Planifiez vos publications aux meilleurs horaires pour maximiser votre portée et votre engagement.',
      },
      {
        title: 'Analytics avancés',
        description:
          'Suivez vos performances en temps réel avec des tableaux de bord détaillés et des insights actionnables.',
      },
      {
        title: 'Templates professionnels',
        description:
          'Accédez à une bibliothèque de 500+ templates optimisés pour chaque niche et chaque format.',
      },
      {
        title: 'Hashtags optimisés',
        description:
          'Générez automatiquement les meilleurs hashtags pour chaque Pin basés sur les tendances actuelles.',
      },
      {
        title: "Ciblage d'audience",
        description:
          'Identifiez et ciblez votre audience idéale avec des recommandations personnalisées.',
      },
      {
        title: 'Optimisation SEO',
        description:
          'Optimisez automatiquement vos titres, descriptions et métadonnées pour le référencement Pinterest.',
      },
      {
        title: 'Publication automatique',
        description:
          'Publiez automatiquement sur plusieurs tableaux et comptes sans intervention manuelle.',
      },
    ],
  },
  howItWorks: {
    badge: 'Comment ça marche',
    title: 'De la création à la publication en 4 étapes simples',
    subtitle:
      'Un workflow optimisé qui vous fait gagner des heures chaque semaine tout en améliorant vos résultats.',
    ready: 'Prêt à automatiser votre Pinterest ?',
    cta: 'Commencer gratuitement',
    steps: [
      {
        title: 'Importez votre contenu',
        description:
          'Téléchargez vos images, vidéos ou connectez vos sources de contenu existantes (Instagram, site web, etc.).',
      },
      {
        title: "Laissez l'IA faire le travail",
        description:
          'Notre IA génère automatiquement des Pins optimisés avec titres accrocheurs, descriptions SEO et hashtags pertinents.',
      },
      {
        title: 'Planifiez en masse',
        description:
          'Sélectionnez vos meilleurs horaires et laissez PinGen publier automatiquement votre contenu au moment optimal.',
      },
      {
        title: 'Observez vos résultats',
        description:
          'Suivez votre croissance en temps réel et laissez nos recommandations affiner votre stratégie pour encore plus de résultats.',
      },
    ],
  },
  pricing: {
    badge: 'Tarifs',
    title: 'Des prix simples, sans surprise',
    subtitle:
      'Commencez gratuitement et passez à un plan supérieur quand vous êtes prêt. Annulation à tout moment.',
    plans: [
      {
        name: 'Starter',
        description: 'Parfait pour débuter',
        features: [
          '10 Pins par mois',
          '1 compte Pinterest',
          'Templates de base',
          'Planification manuelle',
          'Analytics basiques',
        ],
        cta: 'Commencer gratuitement',
      },
      {
        name: 'Pro',
        description: 'Pour les créateurs sérieux',
        features: [
          '100 Pins par mois',
          '3 comptes Pinterest',
          'Templates premium',
          'Planification automatique',
          'Analytics avancés',
          'Génération IA de Pins',
          'Support prioritaire',
        ],
        cta: "Commencer l'essai gratuit",
      },
      {
        name: 'Business',
        description: 'Pour les équipes et agences',
        features: [
          'Pins illimités',
          '10 comptes Pinterest',
          'Templates personnalisables',
          "API d'automatisation",
          'Analytics en temps réel',
          'Génération IA avancée',
          'Support dédié 24/7',
          "Collaboration d'équipe",
        ],
        cta: 'Contacter les ventes',
      },
    ],
  },
  testimonials: {
    badge: 'Témoignages',
    title: 'Ils transforment leur Pinterest avec PinGen',
    subtitle: 'Des créateurs et marques qui gagnent du temps et de la croissance.',
    stats: [
      { value: '50K+', label: 'Utilisateurs actifs' },
      { value: '2M+', label: 'Pins créés' },
      { value: '4.9/5', label: 'Note moyenne' },
      { value: '300%', label: 'Croissance moyenne' },
    ],
    items: [
      {
        name: 'Marie Dubois',
        role: 'Créatrice de contenu',
        content:
          'PinGen a complètement transformé ma stratégie Pinterest. Je gagne 10 heures par semaine et mes vues ont augmenté de 400% en 2 mois.',
      },
      {
        name: 'Thomas Martin',
        role: 'E-commerce Entrepreneur',
        content:
          "L'autopilote et la génération de Pins m'ont permis de scaler mon catalogue sans embaucher. Résultats concrets dès le premier mois.",
      },
      {
        name: 'Sophie Bernard',
        role: 'Marketing Manager',
        content:
          'Nous gérons 5 comptes Pinterest pour nos clients. PinGen nous fait économiser des dizaines d\'heures chaque mois. Indispensable !',
      },
      {
        name: 'Lucas Petit',
        role: 'Influenceur Lifestyle',
        content:
          'La génération IA est incroyable. Je crée des Pins professionnels en quelques secondes. Mon audience a doublé en 3 mois.',
      },
      {
        name: 'Emma Richard',
        role: 'Blogueuse Food',
        content:
          "Je pensais que Pinterest était trop chronophage. PinGen a changé ça. Maintenant je publie 3x plus avec 10x moins d'effort.",
      },
      {
        name: 'Alexandre Moreau',
        role: 'Agence Digital',
        content:
          'Nous recommandons PinGen à tous nos clients. Le ROI est exceptionnel et le support client est réactif et compétent.',
      },
    ],
  },
  faq: {
    badge: 'FAQ',
    title: 'Questions fréquentes',
    subtitle:
      'Tout ce que vous devez savoir sur PinGen. Vous ne trouvez pas votre réponse ? Contactez-nous.',
    items: [
      {
        question: 'Comment fonctionne la génération IA de Pins ?',
        answer:
          'Notre IA analyse votre contenu et génère automatiquement des Pins optimisés avec des titres accrocheurs, des descriptions SEO-friendly et des hashtags pertinents. Vous pouvez personnaliser chaque élément avant de publier.',
      },
      {
        question: 'Puis-je utiliser PinGen avec plusieurs comptes Pinterest ?',
        answer:
          "Oui ! Selon votre plan, vous pouvez connecter jusqu'à 10 comptes Pinterest. Le plan Pro permet 3 comptes, et le plan Business offre jusqu'à 10 comptes avec des fonctionnalités de collaboration d'équipe.",
      },
      {
        question: 'Y a-t-il une limite au nombre de Pins que je peux créer ?',
        answer:
          'Les limites dépendent de votre plan : Starter (10 Pins/mois), Pro (100 Pins/mois), Business (illimité). Vous pouvez upgrader à tout moment si vous atteignez votre limite.',
      },
      {
        question: 'Puis-je annuler mon abonnement à tout moment ?',
        answer:
          "Absolument ! Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Vous conserverez l'accès jusqu'à la fin de votre période de facturation.",
      },
      {
        question: 'Comment fonctionne la planification automatique ?',
        answer:
          "PinGen analyse vos audiences et détermine automatiquement les meilleurs horaires de publication pour maximiser l'engagement. Vous pouvez aussi définir vos propres horaires personnalisés.",
      },
      {
        question: 'Proposez-vous un essai gratuit ?',
        answer:
          "Oui ! Notre plan Starter est gratuit à vie et vous permet de créer jusqu'à 10 Pins par mois. Pour tester les fonctionnalités Pro, nous offrons une période d'essai de 14 jours.",
      },
      {
        question: 'Mes données sont-elles sécurisées ?',
        answer:
          'La sécurité est notre priorité. Nous utilisons un chiffrement de niveau bancaire, nous ne stockons jamais vos mots de passe Pinterest, et nous sommes conformes au RGPD.',
      },
      {
        question: "Comment puis-je obtenir de l'aide ?",
        answer:
          "Nous offrons un support par email pour tous les utilisateurs. Les plans Pro bénéficient d'un support prioritaire, et le plan Business inclut un support dédié 24/7 avec un account manager.",
      },
    ],
  },
  cta: {
    badge: "Commencez gratuitement aujourd'hui",
    title: 'Prêt à révolutionner votre Pinterest ?',
    subtitle:
      'Rejoignez plus de 50 000 créateurs qui gagnent du temps et augmentent leur audience avec PinGen. Essai gratuit, sans engagement.',
    createAccount: 'Créer mon compte gratuit',
    seeDemo: 'Voir la démo',
    trust: 'Aucune carte de crédit requise • Annulation à tout moment',
  },
  footer: {
    product: 'Produit',
    company: 'Entreprise',
    resources: 'Ressources',
    legal: 'Légal',
    tagline: 'Automatisez vos Pins et développez votre trafic Pinterest.',
    rights: 'Tous droits réservés.',
    links: {
      features: 'Fonctionnalités',
      pricing: 'Tarifs',
      templates: 'Templates',
      integrations: 'Intégrations',
      about: 'À propos',
      blog: 'Blog',
      careers: 'Carrières',
      contact: 'Contact',
      docs: 'Documentation',
      tutorials: 'Tutoriels',
      help: "Centre d'aide",
      community: 'Communauté',
      privacy: 'Confidentialité',
      terms: 'Conditions',
      cookies: 'Cookies',
      legalNotice: 'Mentions légales',
    },
  },
  auth: {
    loginTitle: 'Connexion',
    loginSubtitle: 'Entrez vos identifiants pour accéder à votre compte',
    signupTitle: 'Créer un compte',
    signupSubtitle: 'Commencez gratuitement et améliorez votre Pinterest',
    email: 'Email',
    password: 'Mot de passe',
    fullName: 'Nom complet',
    confirmPassword: 'Confirmer le mot de passe',
    rememberMe: 'Se souvenir de moi',
    forgotPassword: 'Mot de passe oublié ?',
    submitLogin: 'Se connecter',
    submitSignup: 'Créer mon compte',
    loggingIn: 'Connexion…',
    creatingAccount: 'Création du compte…',
    orContinueWith: 'Ou continuer avec',
    noAccount: 'Pas encore de compte ?',
    hasAccount: 'Déjà un compte ?',
    createAccount: 'Créer un compte',
    demoMode: 'Mode démo',
    demoHint: 'Essayez PinGen sans créer de compte avec le compte de démonstration',
    demoLogin: 'Se connecter avec le compte démo',
    passwordRules: 'Le mot de passe doit contenir :',
    ruleLength: '8 caractères min',
    ruleNumber: 'Un chiffre',
    ruleSpecial: 'Un caractère spécial',
    acceptTerms: "J'accepte les",
    terms: "conditions d'utilisation",
    privacy: 'politique de confidentialité',
    and: 'et la',
  },
};

export default fr;
