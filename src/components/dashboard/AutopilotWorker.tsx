'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { processAutopilot } from '@/lib/autopilot';
import { useToast } from '@/hooks/use-toast';

/**
 * Remplit automatiquement le calendrier de pins selon le business
 * et les horaires définis dans l'autopilote.
 *
 * En production, préférer un cron serveur (Vercel Cron, worker, etc.).
 */
export function AutopilotWorker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isRunning = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    if (!user || isRunning.current) return;
    isRunning.current = true;

    try {
      const result = await processAutopilot(user.id, 1);
      if (!result.skipped && result.generated > 0) {
        toast({
          title: 'Autopilote : pin généré',
          description: `${result.generated} pin(s) créé(s) et planifié(s) selon vos horaires.`,
        });
        window.dispatchEvent(
          new CustomEvent('pingen:pins-changed', {
            detail: { source: 'autopilot', generated: result.generated },
          })
        );
      }
    } catch (error) {
      console.error('Autopilot worker error:', error);
    } finally {
      isRunning.current = false;
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;

    // Petit délai au chargement pour ne pas bloquer l'UI
    const boot = setTimeout(() => {
      void run();
    }, 4000);

    // Toutes les 3 minutes : génère un pin manquant si besoin
    intervalRef.current = setInterval(() => {
      void run();
    }, 3 * 60 * 1000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void run();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearTimeout(boot);
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, run]);

  return null;
}
