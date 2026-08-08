'use client';

import { useEffect, useRef, useCallback } from 'react';
import { processScheduledPins } from '@/lib/scheduler';
import { useToast } from '@/hooks/use-toast';

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
  const isProcessing = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
            title: 'Pins publiés !',
            description: `${result.successful} pin(s) publié(s) sur Pinterest`,
          });
        }
        
        if (result.failed > 0) {
          toast({
            title: 'Erreur de publication',
            description: `${result.failed} pin(s) n'ont pas pu être publié(s)`,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Scheduler error:', error);
    } finally {
      isProcessing.current = false;
    }
  }, [toast]);

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
