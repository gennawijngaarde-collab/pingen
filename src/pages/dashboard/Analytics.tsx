'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserAnalytics, getUserPins, type Pin } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Share2,
  Users,
  Calendar,
  Download,
  Loader2,
} from 'lucide-react';

interface AnalyticsRow {
  date: string;
  impressions: number;
  saves: number;
  clicks: number;
}

interface StatSummary {
  value: number;
  change: number;
  trend: 'up' | 'down';
}

const RANGE_DAYS: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

function isoDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

function sumRows(rows: AnalyticsRow[]) {
  return rows.reduce(
    (acc, r) => ({
      impressions: acc.impressions + (r.impressions || 0),
      saves: acc.saves + (r.saves || 0),
      clicks: acc.clicks + (r.clicks || 0),
    }),
    { impressions: 0, saves: 0, clicks: 0 }
  );
}

function computeChange(current: number, previous: number): number {
  if (previous <= 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// Simple bar chart component
const BarChart = ({ data }: { data: { label: string; value: number }[] }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((point, index) => (
        <div
          key={index}
          className="flex-1 bg-primary/20 hover:bg-primary/30 rounded-t transition-colors relative group"
          style={{ height: `${(point.value / max) * 100}%` }}
        >
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            {point.label}: {point.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

export function Analytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('7d');
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [previousRows, setPreviousRows] = useState<AnalyticsRow[]>([]);
  const [publishedPins, setPublishedPins] = useState<Pin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const days = RANGE_DAYS[timeRange] || 7;
      const [current, previous, pins] = await Promise.all([
        getUserAnalytics(user.id, isoDate(days - 1), isoDate(0)),
        getUserAnalytics(user.id, isoDate(days * 2 - 1), isoDate(days)),
        getUserPins(user.id, 'published'),
      ]);
      setRows((current as AnalyticsRow[]) || []);
      setPreviousRows((previous as AnalyticsRow[]) || []);
      setPublishedPins(pins || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo((): Record<string, StatSummary> => {
    const current = sumRows(rows);
    const previous = sumRows(previousRows);

    const engagementCurrent =
      current.impressions > 0
        ? Math.round(((current.saves + current.clicks) / current.impressions) * 1000) / 10
        : 0;
    const engagementPrevious =
      previous.impressions > 0
        ? Math.round(((previous.saves + previous.clicks) / previous.impressions) * 1000) / 10
        : 0;

    const make = (value: number, change: number): StatSummary => ({
      value,
      change,
      trend: change >= 0 ? 'up' : 'down',
    });

    return {
      impressions: make(current.impressions, computeChange(current.impressions, previous.impressions)),
      saves: make(current.saves, computeChange(current.saves, previous.saves)),
      clicks: make(current.clicks, computeChange(current.clicks, previous.clicks)),
      engagement: make(engagementCurrent, computeChange(engagementCurrent, engagementPrevious)),
    };
  }, [rows, previousRows]);

  // Données du graphique : impressions par jour (ordre chronologique)
  const chartData = useMemo(() => {
    return [...rows]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => ({
        label: new Date(r.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: r.impressions || 0,
      }));
  }, [rows]);

  // Top pins publiés, triés par impressions
  const topPins = useMemo(() => {
    return [...publishedPins]
      .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
      .slice(0, 4)
      .map((pin) => ({
        ...pin,
        engagement:
          (pin.impressions || 0) > 0
            ? Math.round((((pin.saves || 0) + (pin.clicks || 0)) / (pin.impressions || 1)) * 1000) / 10
            : 0,
      }));
  }, [publishedPins]);

  // Performance par tableau (agrégée depuis les pins publiés)
  const boardStats = useMemo(() => {
    const byBoard = new Map<string, { pins: number; impressions: number; saves: number }>();
    for (const pin of publishedPins) {
      const name = pin.board_name || 'Général';
      const entry = byBoard.get(name) || { pins: 0, impressions: 0, saves: 0 };
      entry.pins += 1;
      entry.impressions += pin.impressions || 0;
      entry.saves += pin.saves || 0;
      byBoard.set(name, entry);
    }
    return [...byBoard.entries()]
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.impressions - a.impressions);
  }, [publishedPins]);

  const maxBoardImpressions = Math.max(...boardStats.map((b) => b.impressions), 1);

  const handleExport = () => {
    const header = 'date,impressions,saves,clicks';
    const lines = [...rows]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((r) => `${r.date},${r.impressions},${r.saves},${r.clicks}`);
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pingen-analytics-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Export téléchargé', description: 'Le fichier CSV a été généré.' });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const statCards = [
    {
      title: 'Impressions',
      stat: stats.impressions,
      format: (v: number) => formatNumber(v),
      icon: <Eye className="w-4 h-4 text-primary" />,
      iconBg: 'bg-primary/10',
    },
    {
      title: 'Saves',
      stat: stats.saves,
      format: (v: number) => formatNumber(v),
      icon: <Heart className="w-4 h-4 text-red-600" />,
      iconBg: 'bg-red-100',
    },
    {
      title: 'Clics',
      stat: stats.clicks,
      format: (v: number) => formatNumber(v),
      icon: <Share2 className="w-4 h-4 text-blue-600" />,
      iconBg: 'bg-blue-100',
    },
    {
      title: "Taux d'engagement",
      stat: stats.engagement,
      format: (v: number) => `${v}%`,
      icon: <Users className="w-4 h-4 text-purple-600" />,
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">
            Suivez les performances de vos Pins
          </p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 heures</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`w-8 h-8 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.format(card.stat.value)}</div>
                  <div
                    className={`flex items-center text-sm ${
                      card.stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {card.stat.trend === 'up' ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    {card.stat.change > 0 ? '+' : ''}
                    {card.stat.change}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des impressions</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">
                  Aucune donnée sur cette période.
                </p>
              ) : (
                <>
                  <BarChart data={chartData} />
                  <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                    <span>{chartData[0]?.label}</span>
                    {chartData.length > 2 && (
                      <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
                    )}
                    <span>{chartData[chartData.length - 1]?.label}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Top Pins & Boards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Pins */}
            <Card>
              <CardHeader>
                <CardTitle>Top Pins</CardTitle>
              </CardHeader>
              <CardContent>
                {topPins.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Aucun pin publié pour le moment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {topPins.map((pin, index) => (
                      <div
                        key={pin.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <span className="text-lg font-bold text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <img
                          src={pin.image_url}
                          alt={pin.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">{pin.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{formatNumber(pin.impressions || 0)} impressions</span>
                            <span>{pin.saves || 0} saves</span>
                          </div>
                        </div>
                        <Badge variant="secondary">{pin.engagement}%</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Board Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance par tableau</CardTitle>
              </CardHeader>
              <CardContent>
                {boardStats.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">
                    Publiez des pins pour voir les performances par tableau.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {boardStats.map((board) => (
                      <div key={board.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{board.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {board.pins} pin{board.pins > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{
                                  width: `${(board.impressions / maxBoardImpressions) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground w-20 text-right">
                            {formatNumber(board.impressions)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
