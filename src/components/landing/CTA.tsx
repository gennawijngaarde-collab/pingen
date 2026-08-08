'use client';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 lg:p-16">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 w-20 h-20 bg-white/10 rounded-full" />
          <div className="absolute bottom-8 left-8 w-16 h-16 bg-white/10 rounded-full" />

          <div className="relative text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Commencez gratuitement aujourd'hui</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Prêt à révolutionner votre Pinterest ?
            </h2>

            {/* Subheadline */}
            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
              Rejoignez plus de 50 000 créateurs qui gagnent du temps et 
              augmentent leur audience avec PinGen. Essai gratuit, sans engagement.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-xl"
                asChild
              >
                <Link to="/signup">
                  Créer mon compte gratuit
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                asChild
              >
                <Link to="/login">Voir la démo</Link>
              </Button>
            </div>

            {/* Trust Text */}
            <p className="mt-8 text-sm text-white/60">
              Aucune carte de crédit requise • Annulation à tout moment
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
