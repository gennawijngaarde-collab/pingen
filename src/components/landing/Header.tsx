'use client';

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HOME_HASH, ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useI18n } from '@/i18n/I18nProvider';
import { Menu, X } from 'lucide-react';

export function Header() {
  const { t } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t.nav.features, href: HOME_HASH.features },
    { label: t.nav.howItWorks, href: HOME_HASH.howItWorks },
    { label: t.nav.pricing, href: HOME_HASH.pricing },
    { label: t.nav.faq, href: HOME_HASH.faq },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link to={ROUTES.home} className="flex items-center gap-3">
            <img 
              src="/genx-logo.jpg" 
              alt="GenX Logo" 
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl object-cover"
            />
            <span className="font-bold text-xl lg:text-2xl bg-gradient-to-r from-[#3B9EFF] to-[#7C3AED] bg-clip-text text-transparent">
              GenX
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.login}>{t.common.login}</Link>
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
              <Link to={ROUTES.signup}>{t.common.signup}</Link>
            </Button>
          </div>

          <div className="flex lg:hidden items-center gap-1">
            <LanguageSwitcher compact />
            <button
              className="p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-t">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="block py-2 text-base font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link to={ROUTES.login}>{t.common.login}</Link>
              </Button>
              <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                <Link to={ROUTES.signup}>{t.common.signup}</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
