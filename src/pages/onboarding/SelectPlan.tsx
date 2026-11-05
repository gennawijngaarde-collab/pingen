'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/hooks/useAuth';
import { startStripeCheckout, type PaidPlan } from '@/lib/stripe';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nProvider';
import { track } from '@/lib/monitoring';

export function SelectPlan() {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useAuth();
  const { t } = useI18n();
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(ROUTES.login, { replace: true });
      return;
    }

    if (!authLoading && profile && profile.plan !== 'starter') {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [authLoading, user, profile, navigate]);

  const handleSelectPlan = async (plan: PaidPlan) => {
    if (isStartingCheckout) return;
    
    setSelectedPlan(plan);
    setIsStartingCheckout(true);
    
    try {
      track('onboarding_plan_selected', { plan });
      await startStripeCheckout(plan);
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsStartingCheckout(false);
      setSelectedPlan(null);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const plans = [
    {
      id: 'pro' as PaidPlan,
      name: t.pricing.plans[1].name,
      price: '19€',
      description: t.pricing.plans[1].description,
      features: t.pricing.plans[1].features,
      popular: true,
    },
    {
      id: 'business' as PaidPlan,
      name: t.pricing.plans[2].name,
      price: '49€',
      description: t.pricing.plans[2].description,
      features: t.pricing.plans[2].features,
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            {t.pricing.trialNote}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Activez votre essai gratuit de 7 jours
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choisissez votre plan pour commencer. Aucun paiement pendant 7 jours, puis {' '}
            <span className="font-medium text-foreground">annulez à tout moment</span>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? 'border-2 border-primary shadow-xl shadow-primary/10'
                  : 'border hover:shadow-lg transition-shadow'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-medium rounded-full flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t.common.popular}
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                <CardDescription className="mb-4">{plan.description}</CardDescription>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/{t.common.perMonth}</span>
                </div>
                <p className="text-sm text-primary font-medium mt-2">
                  Gratuit pendant 7 jours
                </p>
              </CardHeader>

              <CardContent className="space-y-6">
                <ul className="space-y-3">
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
                    plan.popular
                      ? 'bg-primary hover:bg-primary/90'
                      : 'bg-muted hover:bg-muted/80 text-foreground'
                  }`}
                  size="lg"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isStartingCheckout}
                >
                  {isStartingCheckout && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirection vers Stripe...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Commencer l'essai gratuit
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            🔒 Paiement sécurisé par Stripe • Annulez à tout moment • Sans engagement
          </p>
        </div>
      </div>
    </div>
  );
}
