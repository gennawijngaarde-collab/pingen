import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { publishPinsNow } from '@/lib/publish';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';

const CHECK_INTERVAL_MS = 30_000;

const PINTEREST_APP_URL = 'https://developers.pinterest.com/apps/';

/**
 * Client-side safety net for the autopilot: while the app is open it detects
 * overdue scheduled pins and publishes them automatically, so pins go out even
 * if the server-side cron is delayed.
 */
export function AutoPublisher() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [awaitingAccess, setAwaitingAccess] = useState(0);
  const autoTriggered = useRef(false);

  const checkPendingPins = useCallback(async () => {
    if (!user) return 0;
    const { data } = await supabase
      .from('pins')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString());
    const count = data?.length || 0;
    setPendingCount(count);
    return count;
  }, [user]);

  const publishAll = useCallback(async () => {
    if (!user || isPublishing) return;
    setIsPublishing(true);
    setLastError(null);
    try {
      const result = await publishPinsNow({ scope: 'due' });

      setAwaitingAccess(result.awaitingAccess);
      if (result.failed > 0) {
        const firstError = result.details.find((d) => d.error)?.error;
        setLastError(firstError || `${result.failed} pin(s) n'ont pas pu être publiés.`);
      }
      window.dispatchEvent(new Event('pingen:pins-changed'));
      await checkPendingPins();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : 'Publication impossible');
    } finally {
      setIsPublishing(false);
    }
  }, [user, isPublishing, checkPendingPins]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const run = async () => {
      const count = await checkPendingPins();
      if (!cancelled && count > 0 && !autoTriggered.current) {
        autoTriggered.current = true;
        await publishAll();
      }
    };

    void run();
    const interval = setInterval(() => void checkPendingPins(), CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user, checkPendingPins, publishAll]);

  if (awaitingAccess > 0) {
    return (
      <Alert className="mb-6 border-blue-200 bg-blue-50">
        <Clock className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">
          {awaitingAccess} pin(s) en attente d'approbation Pinterest
        </AlertTitle>
        <AlertDescription className="text-blue-800 text-sm space-y-2">
          <p>
            Ton application Pinterest est en accès « Trial » : Pinterest n'autorise pas encore la
            publication réelle. Demande l'accès « Standard » depuis ton espace développeur ; tes pins
            planifiés seront publiés automatiquement dès l'approbation, sans rien refaire.
          </p>
          <a
            href={PINTEREST_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center font-medium underline underline-offset-2"
          >
            Ouvrir developers.pinterest.com
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (pendingCount === 0 && !lastError) return null;

  if (pendingCount === 0 && lastError) {
    return (
      <Alert className="mb-6 border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-900">Publication automatique en échec</AlertTitle>
        <AlertDescription className="text-red-800 text-sm">{lastError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        {pendingCount} pin(s) prêt(s) à publier
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span className="text-amber-800 text-sm">
          {isPublishing
            ? 'Publication automatique en cours…'
            : lastError
              ? lastError
              : 'Ces pins sont planifiés pour maintenant ou avant.'}
        </span>
        <Button
          size="sm"
          onClick={() => void publishAll()}
          disabled={isPublishing}
          className="bg-green-600 hover:bg-green-700 text-white shrink-0"
        >
          {isPublishing ? (
            <>
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Publication...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Publier maintenant
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
