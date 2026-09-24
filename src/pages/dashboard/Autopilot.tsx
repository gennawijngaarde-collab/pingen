'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';
import type { AutopilotDictionary } from '@/i18n/sections/autopilot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DEFAULT_AUTOPILOT,
  DEFAULT_POSTING_HOURS,
  formatHourLabel,
  getAutopilotSettings,
  getUpcomingAutopilotSlots,
  processAutopilot,
  saveAutopilotSettings,
  validateAutopilotForEnable,
  type AutopilotSettings,
} from '@/lib/autopilot';
import { BoundedNumberInput } from '@/components/ui/bounded-number-input';
import {
  Bot,
  Clock,
  Globe,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

const TONE_VALUES = ['professional', 'casual', 'inspiring', 'educational', 'funny'] as const;

/**
 * Niche `value`s are persisted in settings, used as the Pinterest board name and
 * injected into the AI prompt, so they must stay stable; only the label is translated.
 */
const NICHE_OPTIONS: ReadonlyArray<{
  value: string;
  key: keyof AutopilotDictionary['niches'];
}> = [
  { value: 'Décoration', key: 'decoration' },
  { value: 'Mode', key: 'fashion' },
  { value: 'Cuisine', key: 'cooking' },
  { value: 'Voyage', key: 'travel' },
  { value: 'Fitness', key: 'fitness' },
  { value: 'DIY', key: 'diy' },
  { value: 'Technologie', key: 'tech' },
  { value: 'Business', key: 'business' },
  { value: 'Art', key: 'art' },
  { value: 'Photographie', key: 'photography' },
];

/** Mirrors the checks in `validateAutopilotForEnable`, which returns untranslated text. */
function getValidationMessage(settings: AutopilotSettings, ta: AutopilotDictionary): string {
  if (!settings.business.trim()) return ta.validationBusiness;
  return ta.validationHours;
}

export function AutopilotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, dateLocale } = useI18n();
  const ta = t.autopilot;

  const tones = useMemo(
    () => TONE_VALUES.map((value) => ({ value, label: ta.tones[value] })),
    [ta]
  );
  const niches = useMemo(
    () => NICHE_OPTIONS.map(({ value, key }) => ({ value, label: ta.niches[key] })),
    [ta]
  );
  const [settings, setSettings] = useState<AutopilotSettings>(DEFAULT_AUTOPILOT);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingNow, setIsGeneratingNow] = useState(false);
  const [upcoming, setUpcoming] = useState<Date[]>([]);

  const refreshUpcoming = useCallback((s: AutopilotSettings) => {
    setUpcoming(getUpcomingAutopilotSlots(s).slice(0, 8));
  }, []);

  useEffect(() => {
    if (!user) return;
    const loaded = getAutopilotSettings(user.id);
    setSettings(loaded);
    refreshUpcoming(loaded);
  }, [user, refreshUpcoming]);

  const update = <K extends keyof AutopilotSettings>(key: K, value: AutopilotSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const toggleHour = (hour: number) => {
    setSettings((prev) => {
      const has = prev.postingHours.includes(hour);
      const postingHours = has
        ? prev.postingHours.filter((h) => h !== hour)
        : [...prev.postingHours, hour].sort((a, b) => a - b);
      return { ...prev, postingHours };
    });
  };

  const handleSave = async (enable?: boolean) => {
    if (!user) return;

    const next: AutopilotSettings = {
      ...settings,
      enabled: enable ?? settings.enabled,
    };

    if (next.enabled) {
      const error = validateAutopilotForEnable(next);
      if (error) {
        toast({
          title: ta.incompleteConfigTitle,
          description: getValidationMessage(next, ta),
          variant: 'destructive',
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const saved = saveAutopilotSettings(user.id, next);
      setSettings(saved);
      refreshUpcoming(saved);
      toast({
        title: saved.enabled ? ta.enabledTitle : ta.savedTitle,
        description: saved.enabled
          ? fmt(ta.enabledDesc, {
              count: saved.postsPerDay,
              hours: saved.postingHours.map(formatHourLabel).join(', '),
            })
          : ta.savedDesc,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateNow = async () => {
    if (!user) return;
    const error = validateAutopilotForEnable(settings);
    if (error) {
      toast({
        title: ta.incompleteConfigTitle,
        description: getValidationMessage(settings, ta),
        variant: 'destructive',
      });
      return;
    }

    // Force enabled for this run path by saving current config first
    const saved = saveAutopilotSettings(user.id, { ...settings, enabled: true });
    setSettings(saved);

    setIsGeneratingNow(true);
    try {
      const result = await processAutopilot(user.id, 1);
      if (result.generated > 0) {
        toast({
          title: ta.generatedTitle,
          description: ta.generatedDesc,
        });
        refreshUpcoming(getAutopilotSettings(user.id));
        window.dispatchEvent(
          new CustomEvent('pingen:pins-changed', {
            detail: { source: 'autopilot-manual' },
          })
        );
      } else {
        toast({
          title: ta.upToDateTitle,
          description:
            result.reason === 'calendar_full' ? ta.calendarFull : ta.nothingToGenerate,
        });
      }
    } catch (err) {
      toast({
        title: ta.errorTitle,
        description: err instanceof Error ? err.message : ta.generationFailed,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingNow(false);
    }
  };

  return (
    <div className="space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary" />
            {ta.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">{ta.subtitle}</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-card">
          <div>
            <p className="text-sm font-medium">{ta.toggleLabel}</p>
            <p className="text-xs text-muted-foreground">
              {settings.enabled ? ta.active : ta.inactive}
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => {
              void handleSave(checked);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">{ta.businessCardTitle}</CardTitle>
            <CardDescription>{ta.businessCardDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business">{ta.businessLabel}</Label>
              <Textarea
                id="business"
                className="mt-2"
                rows={4}
                placeholder={ta.businessPlaceholder}
                value={settings.business}
                onChange={(e) => update('business', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="website">{ta.websiteLabel}</Label>
              <div className="relative mt-2">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="website"
                  className="pl-9"
                  placeholder={ta.websitePlaceholder}
                  value={settings.websiteUrl}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offer">{ta.offerLabel}</Label>
                <Input
                  id="offer"
                  className="mt-2"
                  placeholder={ta.offerPlaceholder}
                  value={settings.productOrOffer}
                  onChange={(e) => update('productOrOffer', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="audience">{ta.audienceLabel}</Label>
                <Input
                  id="audience"
                  className="mt-2"
                  placeholder={ta.audiencePlaceholder}
                  value={settings.audience}
                  onChange={(e) => update('audience', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{ta.nicheLabel}</Label>
              <div className="flex flex-wrap gap-2">
                {niches.map((niche) => (
                  <button
                    key={niche.value}
                    type="button"
                    onClick={() =>
                      update('niche', settings.niche === niche.value ? '' : niche.value)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      settings.niche === niche.value
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {niche.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">{ta.toneLabel}</Label>
              <div className="flex flex-wrap gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone.value}
                    type="button"
                    onClick={() => update('tone', tone.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      settings.tone === tone.value
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                {ta.statusTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{ta.stateLabel}</span>
                <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                  {settings.enabled ? ta.active : ta.stopped}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{ta.generatedPins}</span>
                <span className="font-medium">{settings.totalGenerated}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">{ta.lastGeneration}</span>
                <span className="font-medium text-right">
                  {settings.lastGeneratedAt
                    ? format(new Date(settings.lastGeneratedAt), 'PPp', { locale: dateLocale })
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {ta.upcomingTitle}
              </CardTitle>
              <CardDescription>{ta.upcomingDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">{ta.noSlots}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {upcoming.map((slot) => (
                    <li
                      key={slot.toISOString()}
                      className="flex justify-between border-b border-border/60 pb-2 last:border-0"
                    >
                      <span>{format(slot, 'EEE d MMM', { locale: dateLocale })}</span>
                      <span className="font-medium">
                        {format(slot, 'p', { locale: dateLocale })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{ta.scheduleCardTitle}</CardTitle>
          <CardDescription>{ta.scheduleCardDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <Label htmlFor="ppd">{ta.postsPerDay}</Label>
              <BoundedNumberInput
                id="ppd"
                min={1}
                max={5}
                className="mt-2"
                value={settings.postsPerDay}
                onCommit={(value) => update('postsPerDay', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {fmt(ta.rangeHint, { min: 1, max: 5 })}
              </p>
            </div>
            <div>
              <Label htmlFor="lookahead">{ta.lookAheadDays}</Label>
              <BoundedNumberInput
                id="lookahead"
                min={1}
                max={14}
                className="mt-2"
                value={settings.lookAheadDays}
                onCommit={(value) => update('lookAheadDays', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {fmt(ta.rangeHint, { min: 1, max: 14 })}
              </p>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <Label>{ta.hoursLabel}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => update('postingHours', [...DEFAULT_POSTING_HOURS])}
              >
                {ta.resetHours}
              </Button>
            </div>
            <div className="grid grid-cols-4 xs:grid-cols-6 sm:grid-cols-8 gap-2">
              {HOUR_OPTIONS.map((hour) => {
                const selected = settings.postingHours.includes(hour);
                return (
                  <button
                    key={hour}
                    type="button"
                    onClick={() => toggleHour(hour)}
                    className={`min-w-0 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {formatHourLabel(hour)}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {fmt(ta.selectedHours, {
                hours: settings.postingHours.length
                  ? settings.postingHours.map(formatHourLabel).join(', ')
                  : ta.noneSelected,
                count: settings.postsPerDay,
              })}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {ta.saving}
                </>
              ) : (
                ta.saveSettings
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void handleGenerateNow();
              }}
              disabled={isGeneratingNow}
            >
              {isGeneratingNow ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {ta.generating}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {ta.generateNow}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
