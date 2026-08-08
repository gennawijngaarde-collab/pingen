'use client';

import { 
  Wand2, 
  Calendar, 
  BarChart3, 
  Palette, 
  Hash, 
  Target,
  Sparkles,
  Clock
} from 'lucide-react';

const features = [
  {
    icon: Wand2,
    title: 'Génération IA de Pins',
    description:
      'Créez des Pins professionnels en secondes grâce à notre IA entraînée sur les meilleures pratiques Pinterest.',
  },
  {
    icon: Calendar,
    title: 'Planification Intelligente',
    description:
      'Planifiez vos publications aux meilleurs horaires pour maximiser votre portée et votre engagement.',
  },
  {
    icon: BarChart3,
    title: 'Analytics Avancés',
    description:
      'Suivez vos performances en temps réel avec des tableaux de bord détaillés et des insights actionnables.',
  },
  {
    icon: Palette,
    title: 'Templates Professionnels',
    description:
      'Accédez à une bibliothèque de 500+ templates optimisés pour chaque niche et chaque format.',
  },
  {
    icon: Hash,
    title: 'Hashtags Optimisés',
    description:
      'Générez automatiquement les meilleurs hashtags pour chaque Pin basés sur les tendances actuelles.',
  },
  {
    icon: Target,
    title: 'Ciblage d\'Audience',
    description:
      'Identifiez et ciblez votre audience idéale avec des recommandations personnalisées.',
  },
  {
    icon: Sparkles,
    title: 'Optimisation SEO',
    description:
      'Optimisez automatiquement vos titres, descriptions et métadonnées pour le référencement Pinterest.',
  },
  {
    icon: Clock,
    title: 'Publication Automatique',
    description:
      'Publiez automatiquement sur plusieurs tableaux et comptes sans intervention manuelle.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Fonctionnalités
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Tout ce dont vous avez besoin pour réussir sur Pinterest
          </h2>
          <p className="text-lg text-muted-foreground">
            Des outils puissants et intuitifs pour créer, planifier et analyser 
            votre contenu Pinterest comme un pro.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-6 lg:p-8 border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Gradient */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
