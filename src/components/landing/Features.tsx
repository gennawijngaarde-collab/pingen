'use client';

import {
  Wand2,
  Calendar,
  BarChart3,
  Palette,
  Hash,
  Target,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';

const ICONS = [Wand2, Calendar, BarChart3, Palette, Hash, Target, Sparkles, Clock];

export function Features() {
  const { t } = useI18n();

  return (
    <section id="features" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t.features.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.features.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.features.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {t.features.items.map((feature, index) => {
            const Icon = ICONS[index] ?? Sparkles;
            return (
              <div
                key={feature.title}
                className="group relative bg-white rounded-2xl p-6 lg:p-8 border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
