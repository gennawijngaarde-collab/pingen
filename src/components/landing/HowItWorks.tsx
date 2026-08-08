'use client';

import { Upload, Wand2, Calendar, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Importez votre contenu',
    description:
      'Téléchargez vos images, vidéos ou connectez vos sources de contenu existantes (Instagram, site web, etc.).',
  },
  {
    number: '02',
    icon: Wand2,
    title: 'Laissez l\'IA faire le travail',
    description:
      'Notre IA génère automatiquement des Pins optimisés avec titres accrocheurs, descriptions SEO et hashtags pertinents.',
  },
  {
    number: '03',
    icon: Calendar,
    title: 'Planifiez en masse',
    description:
      'Sélectionnez vos meilleurs horaires et laissez PinGen publier automatiquement votre contenu au moment optimal.',
  },
  {
    number: '04',
    icon: TrendingUp,
    title: 'Observez vos résultats',
    description:
      'Suivez votre croissance en temps réel et laissez nos recommandations affiner votre stratégie pour encore plus de résultats.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Comment ça marche
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            De la création à la publication en 4 étapes simples
          </h2>
          <p className="text-lg text-muted-foreground">
            Un workflow optimisé qui vous fait gagner des heures chaque semaine 
            tout en améliorant vos résultats.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl p-8 border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                  {/* Number Badge */}
                  <div className="absolute -top-4 left-8 px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mt-2">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            Prêt à automatiser votre Pinterest ?
          </p>
          <a
            href="#pricing"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Commencer gratuitement
            <TrendingUp className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
