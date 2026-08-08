'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n, LOCALE_LABELS, type AppLocale } from '@/i18n/I18nProvider';

const LOCALES: AppLocale[] = ['fr', 'en', 'es', 'de'];

interface LanguageSwitcherProps {
  variant?: 'ghost' | 'outline' | 'secondary';
  compact?: boolean;
}

export function LanguageSwitcher({
  variant = 'ghost',
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <Languages className="w-4 h-4" />
          {!compact && (
            <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
          )}
          {compact && <span className="uppercase text-xs">{locale}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t.common.language}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((code) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLocale(code)}
            className={locale === code ? 'bg-muted font-medium' : ''}
          >
            {LOCALE_LABELS[code]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
