'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
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
import { useAiStatus } from '@/hooks/useAiStatus';
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

const TONES = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'casual', label: 'Décontracté' },
  { value: 'inspiring', label: 'Inspirant' },
  { value: 'educational', label: 'Éducatif' },
  { value: 'funny', label: 'Humoristique' },
];

const NICHES = [
  'Décoration',
  'Mode',
  'Cuisine',
  'Voyage',
  'Fitness',
  'DIY',
  'Technologie',
  'Business',
  'Art',
  'Photographie',
];

export function AutopilotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasTextAi, hasImageAi } = useAiStatus();
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
        toast({ title: 'Configuration incomplète', description: error, variant: 'destructive' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const saved = saveAutopilotSettings(user.id, next);
      setSettings(saved);
      refreshUpcoming(saved);
      toast({
        title: saved.enabled ? 'Autopilote activé' : 'Paramètres enregistrés',
        description: saved.enabled
          ? `${saved.postsPerDay} pin(s)/jour aux horaires : ${saved.postingHours.map(formatHourLabel).join(', ')}`
          : 'Vos réglages ont été sauvegardés.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateNow = async () => {
    if (!user) return;
    const error = validateAutopilotForEnable(settings);
    if (error) {
      toast({ title: 'Configuration incomplète', description: error, variant: 'destructive' });
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
          title: 'Pin généré et planifié',
          description: 'Un nouveau pin a été ajouté à votre calendrier autopilote.',
        });
        refreshUpcoming(getAutopilotSettings(user.id));
        window.dispatchEvent(
          new CustomEvent('pingen:pins-changed', {
            detail: { source: 'autopilot-manual' },
          })
        );
      } else {
        toast({
          title: 'Calendrier à jour',
          description:
            result.reason === 'calendar_full'
              ? 'Tous les créneaux à venir sont déjà remplis.'
              : result.reason || 'Rien à générer pour le moment.',
        });
      }
    } catch (err) {
      toast({
        title: 'Erreur autopilote',
        description: err instanceof Error ? err.message : 'Génération impossible',
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
            Autopilote Pinterest
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Génère et planifie des pins automatiquement selon votre business, aux heures que vous
            choisissez — pour augmenter le trafic vers votre site sans y passer vos journées.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-card">
          <div>
            <p className="text-sm font-medium">Autopilote</p>
            <p className="text-xs text-muted-foreground">
              {settings.enabled ? 'Actif' : 'Inactif'}
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

      {(!hasTextAi || !hasImageAi) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-900 p-4 text-sm">
          {!hasTextAi
            ? "L'IA texte n'est pas active sur cet environnement : l'autopilote utilisera des textes de démo."
            : "L'IA image n'est pas active sur cet environnement : l'autopilote utilisera des images de démo."}{' '}
          Vous pouvez activer l’IA plus tard depuis l’administration.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader>
            <CardTitle className="text-lg">1. Votre business</CardTitle>
            <CardDescription>
              L&apos;IA s&apos;appuie sur ces infos pour créer des pins variés et orientés trafic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business">Description du business *</Label>
              <Textarea
                id="business"
                className="mt-2"
                rows={4}
                placeholder="Ex. Boutique en ligne de bougies artisanales naturelles, style cosy scandinave…"
                value={settings.business}
                onChange={(e) => update('business', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="website">URL de votre site (lien des pins)</Label>
              <div className="relative mt-2">
                <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="website"
                  className="pl-9"
                  placeholder="https://monsite.com"
                  value={settings.websiteUrl}
                  onChange={(e) => update('websiteUrl', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="offer">Offre / produit (optionnel)</Label>
                <Input
                  id="offer"
                  className="mt-2"
                  placeholder="Ex. Kit découverte, coaching…"
                  value={settings.productOrOffer}
                  onChange={(e) => update('productOrOffer', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="audience">Audience (optionnel)</Label>
                <Input
                  id="audience"
                  className="mt-2"
                  placeholder="Ex. Femmes 25–40 ans"
                  value={settings.audience}
                  onChange={(e) => update('audience', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Niche</Label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() =>
                      update('niche', settings.niche === niche ? '' : niche)
                    }
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      settings.niche === niche
                        ? 'bg-primary text-white'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Ton</Label>
              <div className="flex flex-wrap gap-2">
                {TONES.map((tone) => (
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
                Statut
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">État</span>
                <Badge variant={settings.enabled ? 'default' : 'secondary'}>
                  {settings.enabled ? 'Actif' : 'Arrêté'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pins générés</span>
                <span className="font-medium">{settings.totalGenerated}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Dernière génération</span>
                <span className="font-medium text-right">
                  {settings.lastGeneratedAt
                    ? new Date(settings.lastGeneratedAt).toLocaleString('fr-FR')
                    : '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Prochains créneaux
              </CardTitle>
              <CardDescription>Selon vos horaires (aperçu)</CardDescription>
            </CardHeader>
            <CardContent>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun créneau configuré.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {upcoming.map((slot) => (
                    <li
                      key={slot.toISOString()}
                      className="flex justify-between border-b border-border/60 pb-2 last:border-0"
                    >
                      <span>
                        {slot.toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                      <span className="font-medium">
                        {slot.toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
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
          <CardTitle className="text-lg">2. Horaires de publication</CardTitle>
          <CardDescription>
            L&apos;autopilote crée des pins pour ces heures, tous les jours, et les publie via le
            planificateur (compte Pinterest connecté).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div>
              <Label htmlFor="ppd">Pins par jour</Label>
              <BoundedNumberInput
                id="ppd"
                min={1}
                max={5}
                className="mt-2"
                value={settings.postsPerDay}
                onCommit={(value) => update('postsPerDay', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 1 et 5</p>
            </div>
            <div>
              <Label htmlFor="lookahead">Jours à l&apos;avance</Label>
              <BoundedNumberInput
                id="lookahead"
                min={1}
                max={14}
                className="mt-2"
                value={settings.lookAheadDays}
                onCommit={(value) => update('lookAheadDays', value)}
              />
              <p className="text-xs text-muted-foreground mt-1">Entre 1 et 14</p>
            </div>
          </div>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <Label>Heures (heure locale)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => update('postingHours', [...DEFAULT_POSTING_HOURS])}
              >
                Réinitialiser (9h / 13h / 19h)
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
              Sélectionnés :{' '}
              {settings.postingHours.length
                ? settings.postingHours.map(formatHourLabel).join(', ')
                : 'aucun'}
              . Max {settings.postsPerDay} pin(s) / jour parmi ces heures.
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
                  Enregistrement…
                </>
              ) : (
                'Enregistrer les paramètres'
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
                  Génération…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Générer un pin maintenant
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
