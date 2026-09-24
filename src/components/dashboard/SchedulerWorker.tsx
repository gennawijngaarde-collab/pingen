'use client';

import { useEffect, useRef, useCallback } from 'react';
import { processScheduledPins } from '@/lib/scheduler';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/i18n/I18nProvider';
import { fmt } from '@/i18n/fmt';

/**
 * SchedulerWorker Component
 * 
 * This component runs in the background and processes scheduled pins.
 * It checks for pins that need to be published every minute.
 * 
 * In a production environment, this should be replaced with:
 * - A serverless function (Vercel Cron, AWS Lambda)
 * - A background worker (Bull Queue with Redis)
 * - A scheduled job (node-cron on a server)
 */
export function SchedulerWorker() {
  const { toast } = useToast();
  const { t } = useI18n();
  const tw = t.autopilot.worker;
  const isProcessing = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const processPins = useCallback(async () => {
    // Prevent concurrent processing
    if (isProcessing.current) return;
    
    isProcessing.current = true;
    
    try {
      const result = await processScheduledPins();
      
      if (result.processed > 0) {
        console.log('Scheduler processed:', result);
        
        if (result.successful > 0) {
          toast({
            title: tw.publishedTitle,
            description: fmt(tw.publishedDesc, { count: result.successful }),
          });
        }
        
        if (result.failed > 0) {
          toast({
            title: tw.publishFailedTitle,
            description: fmt(tw.publishFailedDesc, { count: result.failed }),
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    } finally {
      isProcessing.current = false;
    }
  }, [toast, tw]);

  useEffect(() => {
    // Process immediately on mount
    processPins();
    
    // Then process every minute
    intervalRef.current = setInterval(processPins, 60000);
    
    // Also process when tab becomes visible (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processPins();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [processPins]);

  // This component doesn't render anything
  return null;
}
