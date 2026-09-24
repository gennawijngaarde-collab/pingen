'use client';

import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { bulkSchedulePins, autoSchedulePins } from '@/lib/scheduler';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Sparkles, Clock } from 'lucide-react';

interface BulkSchedulerProps {
  pinIds: string[];
  userId: string;
  onScheduled: () => void;
}

const INTERVAL_MINUTES = [30, 60, 120, 240, 480, 1440] as const;
const POSTS_PER_DAY_OPTIONS = [1, 2, 3, 4, 5] as const;

export function BulkScheduler({ pinIds, userId, onScheduled }: BulkSchedulerProps) {
  const { toast } = useToast();
  const { t, dateLocale } = useI18n();
  const tb = t.autopilot.bulk;
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const intervalOptions = useMemo(
    () =>
      INTERVAL_MINUTES.map((minutes) => {
        let label: string;
        if (minutes < 60) label = fmt(tb.minutes, { count: minutes });
        else if (minutes === 60) label = tb.oneHour;
        else label = fmt(tb.hours, { count: minutes / 60 });
        return { value: String(minutes), label };
      }),
    [tb]
  );

  const perDayOptions = useMemo(
    () =>
      POSTS_PER_DAY_OPTIONS.map((count) => ({
        value: String(count),
        label: fmt(tb.perDay, { count }),
      })),
    [tb]
  );

  const bestTimes = useMemo(
    () => [
      tb.bestTimes.morning,
      tb.bestTimes.noon,
      tb.bestTimes.afternoon,
      tb.bestTimes.evening,
      tb.bestTimes.night,
    ],
    [tb]
  );

  const handleManualSchedule = async () => {
    if (!selectedDate || pinIds.length === 0) return;

    setIsLoading(true);
    try {
      await bulkSchedulePins(pinIds, selectedDate, intervalMinutes);
      toast({
        title: tb.scheduledTitle,
        description: fmt(tb.scheduledDesc, { count: pinIds.length, minutes: intervalMinutes }),
      });
      onScheduled();
      setIsOpen(false);
    } catch (error) {
      console.error('BulkScheduler manual scheduling failed:', error);
      toast({
        title: tb.errorTitle,
        description: tb.errorDesc,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoSchedule = async () => {
    if (pinIds.length === 0) return;

    setIsLoading(true);
    try {
      await autoSchedulePins(userId, pinIds, new Date(), postsPerDay);
      toast({
        title: tb.autoScheduledTitle,
        description: fmt(tb.autoScheduledDesc, { count: pinIds.length, perDay: postsPerDay }),
      });
      onScheduled();
      setIsOpen(false);
    } catch (error) {
      console.error('BulkScheduler auto scheduling failed:', error);
      toast({
        title: tb.errorTitle,
        description: tb.errorDesc,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="w-4 h-4 mr-2" />
          {tb.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{fmt(tb.scheduleCount, { count: pinIds.length })}</DialogTitle>
          <DialogDescription>{tb.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('manual')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <Clock className="w-6 h-6 mb-2 text-primary" />
              <p className="font-medium">{tb.manual}</p>
              <p className="text-sm text-muted-foreground">{tb.manualDesc}</p>
            </button>
            <button
              onClick={() => setMode('auto')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                mode === 'auto'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              }`}
            >
              <Sparkles className="w-6 h-6 mb-2 text-primary" />
              <p className="font-medium">{tb.auto}</p>
              <p className="text-sm text-muted-foreground">{tb.autoDesc}</p>
            </button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">{tb.startDate}</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={dateLocale}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="mb-2 block">{tb.interval}</Label>
                <Select
                  value={intervalMinutes.toString()}
                  onValueChange={(v) => setIntervalMinutes(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">{tb.autoInfo}</p>
                <ul className="mt-2 text-sm space-y-1">
                  {bestTimes.map((slot) => (
                    <li key={slot}>• {slot}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Label className="mb-2 block">{tb.postsPerDay}</Label>
                <Select
                  value={postsPerDay.toString()}
                  onValueChange={(v) => setPostsPerDay(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {perDayOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t.common.cancel}
          </Button>
          <Button
            onClick={mode === 'manual' ? handleManualSchedule : handleAutoSchedule}
            disabled={isLoading || pinIds.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? tb.scheduling : fmt(tb.scheduleCount, { count: pinIds.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
