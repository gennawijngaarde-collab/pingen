'use client';

import { Link } from 'react-router-dom';
import { Upload, Wand2, Calendar, TrendingUp } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { HOME_HASH } from '@/lib/routes';

const ICONS = [Upload, Wand2, Calendar, TrendingUp];
const NUMBERS = ['01', '02', '03', '04'];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="how-it-works" className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t.howItWorks.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.howItWorks.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.howItWorks.subtitle}</p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {t.howItWorks.steps.map((step, index) => {
              const Icon = ICONS[index] ?? Upload;
              return (
                <div key={step.title} className="relative">
                  <div className="bg-white rounded-2xl p-8 border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute -top-4 left-8 px-3 py-1 bg-primary text-white text-sm font-bold rounded-full">
                      {NUMBERS[index]}
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mt-2">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">{t.howItWorks.ready}</p>
          <Link
            to={HOME_HASH.pricing}
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            {t.howItWorks.cta}
            <TrendingUp className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
