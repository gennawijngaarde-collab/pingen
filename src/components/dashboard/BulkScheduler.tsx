'use client';

import { useState } from 'react';
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

export function BulkScheduler({ pinIds, userId, onScheduled }: BulkSchedulerProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'auto'>('manual');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [intervalMinutes, setIntervalMinutes] = useState(60);
  const [postsPerDay, setPostsPerDay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  const handleManualSchedule = async () => {
    if (!selectedDate || pinIds.length === 0) return;

    setIsLoading(true);
    try {
      await bulkSchedulePins(pinIds, selectedDate, intervalMinutes);
      toast({
        title: 'Pins planifiés !',
        description: `${pinIds.length} pins planifiés avec un intervalle de ${intervalMinutes} minutes`,
      });
      onScheduled();
      setIsOpen(false);
    } catch (error) {
      console.error('BulkScheduler manual scheduling failed:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier les pins',
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
        title: 'Pins planifiés automatiquement !',
        description: `${pinIds.length} pins planifiés aux meilleurs horaires (${postsPerDay}/jour)`,
      });
      onScheduled();
      setIsOpen(false);
    } catch (error) {
      console.error('BulkScheduler auto scheduling failed:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de planifier les pins',
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
          Planification en masse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Planifier {pinIds.length} pins</DialogTitle>
          <DialogDescription>
            Choisissez comment vous souhaitez planifier vos pins
          </DialogDescription>
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
              <p className="font-medium">Manuel</p>
              <p className="text-sm text-muted-foreground">
                Définissez l'intervalle entre chaque pin
              </p>
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
              <p className="font-medium">Automatique</p>
              <p className="text-sm text-muted-foreground">
                Aux meilleurs horaires automatiquement
              </p>
            </button>
          </div>

          {mode === 'manual' ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Date de début</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date < today;
                  }}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="mb-2 block">Intervalle entre les pins</Label>
                <Select
                  value={intervalMinutes.toString()}
                  onValueChange={(v) => setIntervalMinutes(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 heure</SelectItem>
                    <SelectItem value="120">2 heures</SelectItem>
                    <SelectItem value="240">4 heures</SelectItem>
                    <SelectItem value="480">8 heures</SelectItem>
                    <SelectItem value="1440">24 heures</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Les pins seront planifiés automatiquement aux meilleurs horaires
                  pour maximiser l'engagement :
                </p>
                <ul className="mt-2 text-sm space-y-1">
                  <li>• 8h00 - 9h00 (matin)</li>
                  <li>• 12h00 - 13h00 (midi)</li>
                  <li>• 15h00 - 16h00 (après-midi)</li>
                  <li>• 18h00 - 19h00 (soir)</li>
                  <li>• 21h00 - 22h00 (nuit)</li>
                </ul>
              </div>
              <div>
                <Label className="mb-2 block">Publications par jour</Label>
                <Select
                  value={postsPerDay.toString()}
                  onValueChange={(v) => setPostsPerDay(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 par jour</SelectItem>
                    <SelectItem value="2">2 par jour</SelectItem>
                    <SelectItem value="3">3 par jour</SelectItem>
                    <SelectItem value="4">4 par jour</SelectItem>
                    <SelectItem value="5">5 par jour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={mode === 'manual' ? handleManualSchedule : handleAutoSchedule}
            disabled={isLoading || pinIds.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? 'Planification...' : `Planifier ${pinIds.length} pins`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
