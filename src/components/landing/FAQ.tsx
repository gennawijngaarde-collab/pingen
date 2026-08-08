'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'Comment fonctionne la génération IA de Pins ?',
    answer:
      'Notre IA analyse votre contenu et génère automatiquement des Pins optimisés avec des titres accrocheurs, des descriptions SEO-friendly et des hashtags pertinents. Vous pouvez personnaliser chaque élément avant de publier.',
  },
  {
    question: 'Puis-je utiliser PinGen avec plusieurs comptes Pinterest ?',
    answer:
      'Oui ! Selon votre plan, vous pouvez connecter jusqu\'à 10 comptes Pinterest. Le plan Pro permet 3 comptes, et le plan Business offre jusqu\'à 10 comptes avec des fonctionnalités de collaboration d\'équipe.',
  },
  {
    question: 'Y a-t-il une limite au nombre de Pins que je peux créer ?',
    answer:
      'Les limites dépendent de votre plan : Starter (10 Pins/mois), Pro (100 Pins/mois), Business (illimité). Vous pouvez upgrader à tout moment si vous atteignez votre limite.',
  },
  {
    question: 'Puis-je annuler mon abonnement à tout moment ?',
    answer:
      'Absolument ! Vous pouvez annuler votre abonnement à tout moment depuis votre tableau de bord. Vous conserverez l\'accès jusqu\'à la fin de votre période de facturation.',
  },
  {
    question: 'Comment fonctionne la planification automatique ?',
    answer:
      'PinGen analyse vos audiences et détermine automatiquement les meilleurs horaires de publication pour maximiser l\'engagement. Vous pouvez aussi définir vos propres horaires personnalisés.',
  },
  {
    question: 'Proposez-vous un essai gratuit ?',
    answer:
      'Oui ! Notre plan Starter est gratuit à vie et vous permet de créer jusqu\'à 10 Pins par mois. Pour tester les fonctionnalités Pro, nous offrons une période d\'essai de 14 jours.',
  },
  {
    question: 'Mes données sont-elles sécurisées ?',
    answer:
      'La sécurité est notre priorité. Nous utilisons un chiffrement de niveau bancaire, nous ne stockons jamais vos mots de passe Pinterest, et nous sommes conformes au RGPD.',
  },
  {
    question: 'Comment puis-je obtenir de l\'aide ?',
    answer:
      'Nous offrons un support par email pour tous les utilisateurs. Les plans Pro bénéficient d\'un support prioritaire, et le plan Business inclut un support dédié 24/7 avec un account manager.',
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-32 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Questions fréquentes
          </h2>
          <p className="text-lg text-muted-foreground">
            Tout ce que vous devez savoir sur PinGen. 
            Vous ne trouvez pas votre réponse ? Contactez-nous.
          </p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
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

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Vous avez d\'autres questions ?
          </p>
          <a
            href="mailto:support@pingen.io"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            Contactez notre équipe
          </a>
        </div>
      </div>
    </section>
  );
}
