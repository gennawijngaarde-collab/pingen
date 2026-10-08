import { Link } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nProvider';
import { Header } from '@/components/landing/Header';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

export function ComingSoon() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-28 pb-20 px-4 flex flex-col items-center justify-center text-center">
        <p className="text-sm font-medium text-primary mb-2">{t.pages.comingSoonLabel}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{t.pages.comingSoonTitle}</h1>
        <p className="text-muted-foreground max-w-md mb-8">{t.pages.comingSoonDesc}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild>
            <Link to={ROUTES.home}>{t.pages.home}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.signup}>{t.pages.createAccount}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
