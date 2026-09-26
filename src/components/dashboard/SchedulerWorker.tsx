'use client';

import { useEffect, useRef, useCallback } from 'react';
import { publishPinsNow } from '@/lib/publish';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * In-app safety net for the server-side publisher: while the dashboard is open,
 * asks the server (RLS-scoped to this user) to publish overdue pins every
 * 5 minutes. The 24/7 automation itself runs on the cron endpoint.
 */
export function SchedulerWorker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const tw = t.autopilot.worker;
  const isProcessing = useRef(false);
  const lastRunAt = useRef(0);

  const processPins = useCallback(async () => {
    if (!user || isProcessing.current) return;
    if (Date.now() - lastRunAt.current < 60_000) return;

    isProcessing.current = true;
    lastRunAt.current = Date.now();

    try {
      const result = await publishPinsNow({ scope: 'due' });

      if (result.successful > 0) {
        toast({
          title: tw.publishedTitle,
          description: fmt(tw.publishedDesc, { count: result.successful }),
        });
        window.dispatchEvent(new CustomEvent('pingen:pins-changed', { detail: { source: 'scheduler' } }));
      }

      if (result.failed > 0) {
        toast({
          title: tw.publishFailedTitle,
          description: fmt(tw.publishFailedDesc, { count: result.failed }),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    } finally {
      isProcessing.current = false;
    }
  }, [user, toast, tw]);

  useEffect(() => {
    if (!user) return;

    const boot = setTimeout(() => void processPins(), 8000);
    const interval = setInterval(() => void processPins(), CHECK_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') void processPins();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(boot);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, processPins]);

  return null;
}
