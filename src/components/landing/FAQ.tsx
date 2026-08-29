'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useI18n } from '@/i18n/I18nProvider';

export function FAQ() {
  const { t } = useI18n();

  return (
    <section id="faq" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            {t.faq.badge}
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            {t.faq.title}
          </h2>
          <p className="text-lg text-muted-foreground">{t.faq.subtitle}</p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {t.faq.items.map((faq, index) => (
            <AccordionItem
              key={faq.question}
              value={`item-${index}`}
              className="bg-white rounded-xl px-6 border data-[state=open]:shadow-lg transition-shadow"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
