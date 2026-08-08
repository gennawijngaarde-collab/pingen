'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    description: 'Parfait pour débuter',
    price: 0,
    period: 'mois',
    features: [
      '10 Pins par mois',
      '1 compte Pinterest',
      'Templates de base',
      'Planification manuelle',
      'Analytics basiques',
    ],
    cta: 'Commencer gratuitement',
    popular: false,
  },
  {
    name: 'Pro',
    description: 'Pour les créateurs sérieux',
    price: 19,
    period: 'mois',
    features: [
      '100 Pins par mois',
      '3 comptes Pinterest',
      'Templates premium',
      'Planification automatique',
      'Analytics avancés',
      'Génération IA de Pins',
      'Support prioritaire',
    ],
    cta: 'Commencer l\'essai gratuit',
    popular: true,
  },
  {
    name: 'Business',
    description: 'Pour les équipes et agences',
    price: 49,
    period: 'mois',
    features: [
      'Pins illimités',
      '10 comptes Pinterest',
      'Templates personnalisables',
      'API d\'automatisation',
      'Analytics en temps réel',
      'Génération IA avancée',
      'Support dédié 24/7',
      'Collaboration d\'équipe',
    ],
    cta: 'Contacter les ventes',
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Tarifs
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Des prix simples, sans surprise
          </h2>
          <p className="text-lg text-muted-foreground">
            Commencez gratuitement et passez à un plan supérieur quand vous 
            êtes prêt. Annulation à tout moment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 ${
                plan.popular
                  ? 'bg-white border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10'
                  : 'bg-white border hover:shadow-lg transition-shadow'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Le plus populaire
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl lg:text-5xl font-bold text-foreground">
                    {plan.price === 0 ? 'Gratuit' : `${plan.price}€`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-primary hover:bg-primary/90'
                    : 'bg-muted hover:bg-muted/80 text-foreground'
                }`}
                size="lg"
                asChild
              >
                <Link to="/signup">{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Utilisé par des créateurs et des marques du monde entier
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {['Shopify', 'Notion', 'Figma', 'Stripe', 'Vercel'].map((brand) => (
              <span
                key={brand}
                className="text-lg font-bold text-muted-foreground"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
