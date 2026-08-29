'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { useAuth } from '@/hooks/useAuth';
import { usePins } from '@/hooks/usePins';
import type { Pin } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Calendar,
  Clock,
  Plus,
  MoreHorizontal,
  CheckCircle2,
  Clock3,
  FileText,
  Trash2,
  Edit,
  Loader2,
  RefreshCw,
  X,
  Bot,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BulkScheduler } from '@/components/dashboard/BulkScheduler';
import { cancelScheduledPin, schedulePinForPublishing } from '@/lib/scheduler';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nProvider';
import { format, isSameDay, startOfDay } from 'date-fns';

function pinDate(pin: Pin): Date {
  const iso =
    pin.status === 'scheduled'
      ? pin.scheduled_at
      : pin.status === 'published'
        ? pin.published_at
        : pin.created_at;
  return new Date(iso || pin.created_at);
}

/** Un seul statut par jour (priorité : échoué > planifié > brouillon > publié) */
function dominantStatus(statuses: Pin['status'][]): Pin['status'] | null {
  const order: Pin['status'][] = ['failed', 'scheduled', 'draft', 'published'];
  for (const s of order) {
    if (statuses.includes(s)) return s;
  }
  return null;
}

export function Schedule() {
  const { user } = useAuth();
  const { pins, fetchPins, deletePin, updatePin } = usePins();
  const { toast } = useToast();
  const { t, dateLocale } = useI18n();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activeTab, setActiveTab] = useState('scheduled');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPins, setSelectedPins] = useState<string[]>([]);
  const [editingPin, setEditingPin] = useState<Pin | null>(null);
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>();
  const [newScheduleTime, setNewScheduleTime] = useState('09:00');
  const [contentPin, setContentPin] = useState<Pin | null>(null);
  const [viewPin, setViewPin] = useState<Pin | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadPins = useCallback(async () => {
    setIsLoading(true);
    await fetchPins();
    setIsLoading(false);
  }, [fetchPins]);

  useEffect(() => {
    void loadPins();
  }, [loadPins]);

  useEffect(() => {
    const onPinsChanged = () => void loadPins();
    window.addEventListener('pingen:pins-changed', onPinsChanged);
    return () => window.removeEventListener('pingen:pins-changed', onPinsChanged);
  }, [loadPins]);

  // Pastilles : un statut dominant par jour (évite le conflit rouge/bleu)
  const calendarModifiers = useMemo(() => {
    const byDay = new Map<string, Pin['status'][]>();
    for (const pin of pins) {
      const key = format(startOfDay(pinDate(pin)), 'yyyy-MM-dd');
      const list = byDay.get(key) || [];
      list.push(pin.status);
      byDay.set(key, list);
    }

    const byStatus: Record<'scheduled' | 'draft' | 'published' | 'failed', Date[]> = {
      scheduled: [],
      draft: [],
      published: [],
      failed: [],
    };

    for (const [key, statuses] of byDay) {
      const dominant = dominantStatus(statuses);
      if (dominant && byStatus[dominant]) {
        byStatus[dominant].push(new Date(`${key}T12:00:00`));
      }
    }
    return byStatus;
  }, [pins]);

  const pinsOnSelectedDate = useMemo(() => {
    if (!date) return [];
    return pins
      .filter((pin) => isSameDay(pinDate(pin), date))
      .sort((a, b) => pinDate(a).getTime() - pinDate(b).getTime());
  }, [pins, date]);

  const filteredPins = pins
    .filter((pin) => {
      if (activeTab === 'scheduled') return pin.status === 'scheduled';
      if (activeTab === 'drafts') return pin.status === 'draft';
      if (activeTab === 'published') return pin.status === 'published';
      return true;
    })
    .sort((a, b) => {
      if (activeTab === 'scheduled') {
        return (
          new Date(a.scheduled_at || 0).getTime() -
          new Date(b.scheduled_at || 0).getTime()
        );
      }
      return pinDate(b).getTime() - pinDate(a).getTime();
    });

  const handleDelete = async (pinId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce pin ?')) return;
    try {
      await deletePin(pinId);
      toast({ title: 'Pin supprimé' });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le pin',
        variant: 'destructive',
      });
    }
  };

  const handleCancelSchedule = async (pinId: string) => {
    try {
      await cancelScheduledPin(pinId);
      await loadPins();
      toast({ title: 'Planification annulée' });
    } catch {
      toast({
        title: 'Erreur',
        description: "Impossible d'annuler la planification",
        variant: 'destructive',
      });
    }
  };

  const handleReschedule = async () => {
    if (!editingPin || !newScheduleDate) return;
    try {
      const scheduledAt = new Date(newScheduleDate);
      const [hours, minutes] = newScheduleTime.split(':').map(Number);
      scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);

      await schedulePinForPublishing(editingPin.id, scheduledAt);
      const wasDraft = editingPin.status === 'draft';
      setEditingPin(null);
      setNewScheduleDate(undefined);
      await loadPins();
      if (wasDraft) setActiveTab('scheduled');
      toast({
        title: wasDraft ? 'Pin planifié' : 'Pin replanifié',
        description: `Publication le ${format(scheduledAt, "dd MMM yyyy 'à' HH:mm", { locale: dateLocale })}`,
      });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de replanifier le pin',
        variant: 'destructive',
      });
    }
  };

  const openScheduler = (pin: Pin) => {
    setEditingPin(pin);
    if (pin.scheduled_at) {
      const current = new Date(pin.scheduled_at);
      setNewScheduleDate(current);
      setNewScheduleTime(format(current, 'HH:mm'));
    } else {
      setNewScheduleDate(undefined);
      setNewScheduleTime('09:00');
    }
  };

  const openContentEditor = (pin: Pin) => {
    setViewPin(null);
    setContentPin(pin);
    setEditTitle(pin.title);
    setEditDescription(pin.description || '');
  };

  const openPinDetails = (pin: Pin) => {
    setViewPin(pin);
  };

  const copyHashtags = async (tags: string[]) => {
    if (!tags.length) return;
    try {
      await navigator.clipboard.writeText(tags.join(' '));
      toast({ title: t.schedule.copyHashtags });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier',
        variant: 'destructive',
      });
    }
  };

  const handleSaveContent = async () => {
    if (!contentPin) return;
    if (!editTitle.trim()) {
      toast({
        title: 'Titre requis',
        description: 'Le titre ne peut pas être vide.',
        variant: 'destructive',
      });
      return;
    }
    const updated = await updatePin(contentPin.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });
    if (updated) {
      setContentPin(null);
      toast({ title: 'Pin modifié' });
    } else {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le pin',
        variant: 'destructive',
      });
    }
  };

  const togglePinSelection = (pinId: string) => {
    setSelectedPins((prev) =>
      prev.includes(pinId) ? prev.filter((id) => id !== pinId) : [...prev, pinId]
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: dateLocale });
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'HH:mm');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            {t.schedule.published}
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            <Clock3 className="w-3 h-3 mr-1" />
            {t.schedule.scheduled}
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="secondary">
            <FileText className="w-3 h-3 mr-1" />
            {t.schedule.draft}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <X className="w-3 h-3 mr-1" />
            {t.schedule.failed}
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const PinCard = ({ pin }: { pin: Pin }) => (
    <Card className="overflow-hidden group">
      <div className="flex">
        {activeTab === 'drafts' && (
          <div
            className="flex items-center px-3 border-r"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selectedPins.includes(pin.id)}
              onCheckedChange={() => togglePinSelection(pin.id)}
            />
          </div>
        )}
        <button
          type="button"
          className="flex flex-1 text-left min-w-0 hover:bg-muted/40 transition-colors"
          onClick={() => openPinDetails(pin)}
        >
          <div className="w-24 h-24 flex-shrink-0 bg-muted">
            <img
              src={pin.image_url}
              alt={pin.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm line-clamp-1">{pin.title}</h4>
                <p className="text-xs text-muted-foreground">{pin.board_name}</p>

                {pin.status === 'scheduled' && pin.scheduled_at && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-blue-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(pin.scheduled_at)}
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Clock className="w-3 h-3" />
                      {formatTime(pin.scheduled_at)}
                    </span>
                  </div>
                )}

                {pin.status === 'draft' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {t.schedule.createdOn} {formatDate(pin.created_at)}
                  </p>
                )}

                {pin.status === 'published' && pin.published_at && (
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {t.schedule.publishedOn} {formatDate(pin.published_at)}
                    </span>
                  </div>
                )}

                {pin.status === 'failed' && (
                  <p className="text-xs text-red-600 mt-2">
                    {pin.error_message || 'Erreur de publication'}
                  </p>
                )}

                {pin.description && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    {pin.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {getStatusBadge(pin.status)}
              </div>
            </div>
          </div>
        </button>
        <div
          className="flex items-start pt-3 pr-2"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openPinDetails(pin)}>
                <FileText className="w-4 h-4 mr-2" />
                {t.schedule.viewPin}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openContentEditor(pin)}>
                <Edit className="w-4 h-4 mr-2" />
                {t.schedule.modify}
              </DropdownMenuItem>
              {pin.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => openScheduler(pin)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t.schedule.reschedule}
                </DropdownMenuItem>
              )}
              {pin.status === 'scheduled' && (
                <DropdownMenuItem onClick={() => void handleCancelSchedule(pin.id)}>
                  <X className="w-4 h-4 mr-2" />
                  {t.schedule.cancelSchedule}
                </DropdownMenuItem>
              )}
              {pin.status === 'draft' && (
                <DropdownMenuItem onClick={() => openScheduler(pin)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {t.schedule.plan}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => void handleDelete(pin.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t.schedule.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t.schedule.title}</h2>
          <p className="text-muted-foreground">{t.schedule.subtitle}</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'drafts' && selectedPins.length > 0 && user && (
            <BulkScheduler
              pinIds={selectedPins}
              userId={user.id}
              onScheduled={() => {
                setSelectedPins([]);
                void loadPins();
              }}
            />
          )}
          <Button variant="outline" asChild>
            <Link to={ROUTES.autopilot}>
              <Bot className="w-4 h-4 mr-2" />
              {t.schedule.autopilot}
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90" asChild>
            <Link to={ROUTES.generator}>
              <Plus className="w-4 h-4 mr-2" />
              {t.schedule.createPin}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.schedule.calendar}</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                locale={dateLocale}
                selected={date}
                onSelect={setDate}
                className="rounded-md border w-full"
                modifiers={calendarModifiers}
                modifiersClassNames={{
                  scheduled:
                    'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-blue-500',
                  draft:
                    'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-gray-400',
                  published:
                    'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-green-500',
                  failed:
                    'relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-red-500',
                }}
              />

              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-sm">{t.schedule.legend}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span>{t.schedule.scheduled}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span>{t.schedule.draft}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>{t.schedule.published}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>{t.schedule.failed}</span>
                  </div>
                </div>
              </div>

              {date && (
                <div className="mt-6 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-sm capitalize">
                    {format(date, 'dd MMMM yyyy', { locale: dateLocale })}
                  </h4>
                  {pinsOnSelectedDate.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t.schedule.noPinThatDay}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pinsOnSelectedDate.map((pin) => (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => openPinDetails(pin)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                              pin.status === 'scheduled'
                                ? 'bg-blue-500'
                                : pin.status === 'published'
                                  ? 'bg-green-500'
                                  : pin.status === 'failed'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                            }`}
                          />
                          <img
                            src={pin.image_url}
                            alt={pin.title}
                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium line-clamp-1">
                              {pin.title}
                            </p>
                            {pin.status === 'scheduled' && pin.scheduled_at && (
                              <p className="text-xs text-muted-foreground">
                                {formatTime(pin.scheduled_at)}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="scheduled" className="gap-2">
                  <Clock3 className="w-4 h-4" />
                  {t.schedule.scheduled}
                  <Badge variant="secondary" className="ml-1">
                    {pins.filter((p) => p.status === 'scheduled').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="drafts" className="gap-2">
                  <FileText className="w-4 h-4" />
                  {t.schedule.draft}
                  <Badge variant="secondary" className="ml-1">
                    {pins.filter((p) => p.status === 'draft').length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="published" className="gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {t.schedule.published}
                  <Badge variant="secondary" className="ml-1">
                    {pins.filter((p) => p.status === 'published').length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <Button variant="outline" size="sm" onClick={() => void loadPins()}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <TabsContent value="scheduled" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t.schedule.noScheduled}</p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link to={ROUTES.generator}>{t.schedule.createPin}</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t.schedule.noDrafts}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="published" className="mt-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredPins.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>{t.schedule.noPublished}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPins.map((pin) => (
                    <PinCard key={pin.id} pin={pin} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={!!editingPin} onOpenChange={(open) => !open && setEditingPin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPin?.status === 'draft'
                ? t.schedule.planPin
                : t.schedule.reschedulePin}
            </DialogTitle>
            <DialogDescription>{t.schedule.chooseDateTime}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <CalendarComponent
              mode="single"
              locale={dateLocale}
              selected={newScheduleDate}
              onSelect={setNewScheduleDate}
              disabled={(d) => d < startOfDay(new Date())}
              className="rounded-md border w-full"
            />
            <div className="space-y-2">
              <Label htmlFor="scheduleTime">{t.schedule.publishTime}</Label>
              <Input
                id="scheduleTime"
                type="time"
                value={newScheduleTime}
                onChange={(e) => setNewScheduleTime(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPin(null)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => void handleReschedule()}
              disabled={!newScheduleDate}
              className="bg-primary hover:bg-primary/90"
            >
              {editingPin?.status === 'draft'
                ? t.schedule.plan
                : t.schedule.reschedule}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewPin} onOpenChange={(open) => !open && setViewPin(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.schedule.viewPin}</DialogTitle>
            <DialogDescription>
              {viewPin?.board_name || t.schedule.autopilot}
            </DialogDescription>
          </DialogHeader>
          {viewPin && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl overflow-hidden border bg-muted aspect-[2/3] max-h-72 mx-auto w-full max-w-[220px]">
                <img
                  src={viewPin.image_url}
                  alt={viewPin.alt_text || viewPin.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                {getStatusBadge(viewPin.status)}
                {viewPin.status === 'scheduled' && viewPin.scheduled_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(viewPin.scheduled_at)} · {formatTime(viewPin.scheduled_at)}
                  </span>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t.schedule.titleLabel}</Label>
                <p className="font-semibold mt-1">{viewPin.title}</p>
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">
                  {t.schedule.descriptionLabel}
                </Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {viewPin.description || '—'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Label className="text-muted-foreground text-xs">
                    {t.schedule.hashtags}
                  </Label>
                  {viewPin.hashtags?.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => void copyHashtags(viewPin.hashtags)}
                    >
                      {t.schedule.copyHashtags}
                    </Button>
                  )}
                </div>
                {viewPin.hashtags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewPin.hashtags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag.startsWith('#') ? tag : `#${tag}`}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground text-xs">{t.schedule.altText}</Label>
                <p className="text-sm mt-1 text-muted-foreground">
                  {viewPin.alt_text || '—'}
                </p>
              </div>

              {viewPin.link && (
                <div>
                  <Label className="text-muted-foreground text-xs">{t.schedule.link}</Label>
                  <a
                    href={viewPin.link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline break-all block mt-1"
                  >
                    {viewPin.link}
                  </a>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setViewPin(null)}>
              {t.schedule.close}
            </Button>
            {viewPin && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewPin) openContentEditor(viewPin);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t.schedule.modify}
                </Button>
                {(viewPin.status === 'scheduled' || viewPin.status === 'draft') && (
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => {
                      const pin = viewPin;
                      setViewPin(null);
                      if (pin) openScheduler(pin);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {viewPin.status === 'draft'
                      ? t.schedule.plan
                      : t.schedule.reschedule}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!contentPin} onOpenChange={(open) => !open && setContentPin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.schedule.editPin}</DialogTitle>
            <DialogDescription>{t.schedule.editPinDesc}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {contentPin && (
              <div className="flex items-center gap-3">
                <img
                  src={contentPin.image_url}
                  alt={contentPin.title}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="text-sm text-muted-foreground">
                  {contentPin.board_name}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="editTitle">{t.schedule.titleLabel}</Label>
              <Input
                id="editTitle"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">{t.schedule.descriptionLabel}</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContentPin(null)}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => void handleSaveContent()}
              className="bg-primary hover:bg-primary/90"
            >
              {t.common.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
