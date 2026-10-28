'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Expand } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

const SOURCES = [
  '/examples/amazon.jpg',
  '/examples/time.jpg',
  '/examples/blog.jpg',
  '/examples/etsy.jpg',
  '/examples/traffic.jpg',
  '/examples/creators.jpg',
  '/examples/analytics.jpg',
  '/examples/shopify.jpg',
] as const;

export function Examples() {
  const { t } = useI18n();
  const [active, setActive] = useState<number | null>(null);
  const items = t.examples.items.map((item, index) => ({
    ...item,
    src: SOURCES[index],
  }));
  const selected = active === null ? null : items[active];

  return (
    <section id="examples" className="scroll-mt-24 py-20 lg:py-32 bg-gradient-to-b from-white via-[#F7F7F7] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t.examples.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.examples.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.examples.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {items.map((item, index) => (
            <button
              key={item.src}
              type="button"
              onClick={() => setActive(index)}
              className="group text-left bg-white rounded-2xl border border-[#E2E2E2] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <div className="relative aspect-[2/3] overflow-hidden bg-[#F7F7F7]">
                <img
                  src={item.src}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                  <Expand className="w-3.5 h-3.5" />
                  {t.examples.enlarge}
                </span>
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{item.caption}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-8 rounded-xl shadow-lg shadow-primary/25"
            asChild
          >
            <Link to={ROUTES.signup}>
              {t.examples.cta}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>

      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setActive(null); }}>
        <DialogContent className="max-w-[min(92vw,460px)] gap-3 bg-white p-3 sm:max-w-[460px]">
          {selected && (
            <>
              <img
                src={selected.src}
                alt={selected.title}
                className="w-full rounded-xl"
              />
              <div className="px-1 pb-1">
                <DialogTitle className="text-base">{selected.title}</DialogTitle>
                <DialogDescription className="mt-1">{selected.caption}</DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
