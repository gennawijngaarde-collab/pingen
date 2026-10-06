'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { processAutopilot } from '@/lib/autopilot';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';

/**
 * Remplit automatiquement le calendrier de pins selon le business
 * et les horaires définis dans l'autopilote.
 *
 * L'état actif/inactif est lu depuis le compte (Supabase Auth user_metadata)
 * à chaque exécution : désactiver l'autopilote sur un appareil l'arrête partout.
 */
export function AutopilotWorker() {
  const { user } = useAuth();
  const userId = user?.id;
  const { toast } = useToast();
  const { t } = useI18n();
  const tw = t.autopilot.worker;
  const isRunning = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(async () => {
    if (!userId || isRunning.current) return;
    isRunning.current = true;

    try {
      const result = await processAutopilot(userId, 1);
      if (!result.skipped && result.generated > 0) {
        toast({
          title: tw.generatedTitle,
          description: fmt(tw.generatedDesc, { count: result.generated }),
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
  }, [userId, toast, tw]);

  useEffect(() => {
    if (!userId) return;

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
  }, [userId, run]);

  return null;
}
