'use client';

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePins } from '@/hooks/usePins';
import { getUserAnalytics } from '@/lib/supabase';
import { getAutopilotStatusSummary } from '@/lib/autopilot';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  Eye,
  Heart,
  Share2,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Wand2,
  Bot,
} from 'lucide-react';

interface DashboardStats {
  impressions: number;
  impressionsChange: number;
  saves: number;
  savesChange: number;
  clicks: number;
  clicksChange: number;
  engagement: number;
  engagementChange: number;
}

const EMPTY_STATS: DashboardStats = {
  impressions: 0,
  impressionsChange: 0,
  saves: 0,
  savesChange: 0,
  clicks: 0,
  clicksChange: 0,
  engagement: 0,
  engagementChange: 0,
};

function isoDate(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString().slice(0, 10);
}

function pctChange(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function AutopilotBanner({ userId }: { userId: string }) {
  const summary = getAutopilotStatusSummary(userId);

  return (
    <Card className={summary.enabled ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">Autopilote Pinterest</p>
              <Badge variant={summary.enabled ? 'default' : 'secondary'}>
                {summary.enabled ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {summary.enabled
                ? `${summary.postsPerDay} pin(s)/jour · ${summary.hoursLabel || 'horaires à définir'}${
                    summary.business ? ` · ${summary.business.slice(0, 60)}${summary.business.length > 60 ? '…' : ''}` : ''
                  }`
                : 'Activez la génération automatique selon votre business et vos horaires.'}
            </p>
          </div>
        </div>
        <Button asChild variant={summary.enabled ? 'outline' : 'default'} className={!summary.enabled ? 'bg-primary hover:bg-primary/90' : ''}>
          <Link to={ROUTES.autopilot}>
            {summary.enabled ? 'Gérer' : 'Configurer'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { user, profile } = useAuth();
  const { pins, fetchPins } = usePins();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);

  useEffect(() => {
    const loadData = async () => {
      await fetchPins();
      setIsLoading(false);
    };
    loadData();
  }, [fetchPins]);

  useEffect(() => {
    if (!user) return;
    // Stats des 7 derniers jours, comparées aux 7 jours précédents
    const loadStats = async () => {
      try {
        const [currentRows, previousRows] = await Promise.all([
          getUserAnalytics(user.id, isoDate(6), isoDate(0)),
          getUserAnalytics(user.id, isoDate(13), isoDate(7)),
        ]);
        interface Totals {
          impressions: number;
          saves: number;
          clicks: number;
        }
        const sum = (rows: unknown[] | null): Totals => {
          const totals: Totals = { impressions: 0, saves: 0, clicks: 0 };
          for (const row of (rows || []) as Partial<Totals>[]) {
            totals.impressions += row.impressions || 0;
            totals.saves += row.saves || 0;
            totals.clicks += row.clicks || 0;
          }
          return totals;
        };
        const current = sum(currentRows);
        const previous = sum(previousRows);
        const engagement =
          current.impressions > 0
            ? Math.round(((current.saves + current.clicks) / current.impressions) * 1000) / 10
            : 0;
        const prevEngagement =
          previous.impressions > 0
            ? Math.round(((previous.saves + previous.clicks) / previous.impressions) * 1000) / 10
            : 0;
        setStats({
          impressions: current.impressions,
          impressionsChange: pctChange(current.impressions, previous.impressions),
          saves: current.saves,
          savesChange: pctChange(current.saves, previous.saves),
          clicks: current.clicks,
          clicksChange: pctChange(current.clicks, previous.clicks),
          engagement,
          engagementChange: pctChange(engagement, prevEngagement),
        });
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      }
    };
    loadStats();
  }, [user]);

  const recentPins = pins.slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Publié
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock className="w-3 h-3 mr-1" />
            Planifié
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Brouillon
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const pinsThisMonth = profile?.pins_created_this_month || 0;
  const pinLimit = profile?.plan === 'starter' ? 10 : profile?.plan === 'pro' ? 100 : Infinity;
  const pinProgress = pinLimit === Infinity ? 0 : (pinsThisMonth / pinLimit) * 100;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">
            Bonjour, {profile?.full_name?.split(' ')[0] || 'Utilisateur'} ! 👋
          </h2>
          <p className="text-muted-foreground">
            Voici ce qui se passe avec votre Pinterest aujourd'hui.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link to={ROUTES.autopilot}>
              <Bot className="w-4 h-4 mr-2" />
              Autopilote
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to={ROUTES.schedule}>
              <Calendar className="w-4 h-4 mr-2" />
              Voir le calendrier
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link to={ROUTES.generator}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un Pin
            </Link>
          </Button>
        </div>
      </div>

      {user && (
        <AutopilotBanner userId={user.id} />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impressions
            </CardTitle>
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.impressions)}
            </div>
            <div
              className={`flex items-center text-sm ${
                stats.impressionsChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.impressionsChange >= 0 ? '+' : ''}
              {stats.impressionsChange}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saves
            </CardTitle>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.saves)}
            </div>
            <div
              className={`flex items-center text-sm ${
                stats.savesChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.savesChange >= 0 ? '+' : ''}
              {stats.savesChange}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clics
            </CardTitle>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Share2 className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(stats.clicks)}
            </div>
            <div
              className={`flex items-center text-sm ${
                stats.clicksChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.clicksChange >= 0 ? '+' : ''}
              {stats.clicksChange}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engagement
            </CardTitle>
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagement}%</div>
            <div
              className={`flex items-center text-sm ${
                stats.engagementChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              {stats.engagementChange >= 0 ? '+' : ''}
              {stats.engagementChange}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Pins */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pins récents</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link to={ROUTES.schedule}>
                Voir tout
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : recentPins.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="mb-4">Vous n'avez pas encore de pins.</p>
                <Button className="bg-primary hover:bg-primary/90" asChild>
                  <Link to={ROUTES.generator}>
                    <Plus className="w-4 h-4 mr-2" />
                    Créer mon premier Pin
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentPins.map((pin) => (
                <Card key={pin.id} className="overflow-hidden group">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={pin.image_url}
                      alt={pin.alt_text || pin.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2">
                      {getStatusBadge(pin.status)}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h4 className="font-semibold line-clamp-2 mb-1">{pin.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {pin.board_name}
                    </p>
                    {pin.status === 'published' && pin.published_at && (
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Publié le{' '}
                        {new Date(pin.published_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    )}
                    {pin.status === 'scheduled' && pin.scheduled_at && (
                      <p className="text-sm text-blue-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(pin.scheduled_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Plan Usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Utilisation du plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Pins ce mois</span>
                  <span className="font-medium">
                    {pinsThisMonth} / {pinLimit === Infinity ? '∞' : pinLimit}
                  </span>
                </div>
                <Progress value={pinProgress} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Comptes Pinterest</span>
                  <span className="font-medium">
                    {profile?.pinterest_accounts_connected || 0} /{' '}
                    {profile?.plan === 'starter' ? 1 : profile?.plan === 'pro' ? 3 : 10}
                  </span>
                </div>
                <Progress
                  value={
                    ((profile?.pinterest_accounts_connected || 0) /
                      (profile?.plan === 'starter' ? 1 : profile?.plan === 'pro' ? 3 : 10)) *
                    100
                  }
                  className="h-2"
                />
              </div>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">
                  Plan actuel:{' '}
                  <span className="font-medium text-foreground capitalize">
                    {profile?.plan || 'starter'}
                  </span>
                </p>
                {profile?.plan === 'starter' && (
                  <Button className="w-full mt-3 bg-primary hover:bg-primary/90" size="sm" asChild>
                    <Link to={ROUTES.settingsBilling}>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Passer à Pro
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={ROUTES.autopilot}>
                  <Bot className="w-4 h-4 mr-2" />
                  Configurer l&apos;autopilote
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={ROUTES.generator}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Générer un Pin avec IA
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={ROUTES.schedule}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier des Pins
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to={ROUTES.analytics}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Voir les analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Tips */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Conseil du jour</h4>
                  <p className="text-sm text-muted-foreground">
                    Publiez entre 14h et 16h pour maximiser votre engagement 
                    sur Pinterest.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
