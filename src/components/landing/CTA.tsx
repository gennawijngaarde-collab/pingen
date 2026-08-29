'use client';

import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

export function CTA() {
  const { t } = useI18n();

  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-primary p-8 lg:p-16">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 text-white text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{t.cta.badge}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              {t.cta.title}
            </h2>

            <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">{t.cta.subtitle}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg rounded-xl shadow-xl"
                asChild
              >
                <Link to={ROUTES.signup}>
                  {t.cta.createAccount}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg rounded-xl"
                asChild
              >
                <Link to={ROUTES.login}>{t.cta.seeDemo}</Link>
              </Button>
            </div>

            <p className="mt-8 text-sm text-white/60">{t.cta.trust}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
