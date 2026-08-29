'use client';

import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const PRICES = [0, 19, 49];

export function Pricing() {
  const { t } = useI18n();

  return (
    <section id="pricing" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t.pricing.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.pricing.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.pricing.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {t.pricing.plans.map((plan, index) => {
            const price = PRICES[index] ?? 0;
            const popular = index === 1;
            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  popular
                    ? 'bg-white border-2 border-primary shadow-xl shadow-primary/10 scale-105 z-10'
                    : 'bg-white border hover:shadow-lg transition-shadow'
                }`}
              >
                {popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {t.common.popular}
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl lg:text-5xl font-bold text-foreground">
                      {price === 0 ? t.common.free : `${price}€`}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">/{t.common.perMonth}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    popular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                  size="lg"
                  asChild
                >
                  <Link to={ROUTES.signup}>{plan.cta}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
