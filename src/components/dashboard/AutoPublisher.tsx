import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { publishPinsNow, describePublishError, fmt } from '@/lib/publish';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/i18n/I18nProvider';
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
  const { t } = useI18n();
  const tp = t.publish;
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
        const firstError = result.details.find((d) => d.status !== 'awaiting_access' && d.error)?.error;
        setLastError(firstError || fmt(tp.someFailed, { count: result.failed }));
      }
      window.dispatchEvent(new Event('pingen:pins-changed'));
      await checkPendingPins();
    } catch (error) {
      setLastError(describePublishError(error, tp));
    } finally {
      setIsPublishing(false);
    }
  }, [user, isPublishing, checkPendingPins, tp]);

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
          {fmt(tp.awaitingAccessTitle, { count: awaitingAccess })}
        </AlertTitle>
        <AlertDescription className="text-blue-800 text-sm space-y-2">
          <p>{tp.awaitingAccessBody}</p>
          <a
            href={PINTEREST_APP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center font-medium underline underline-offset-2"
          >
            {tp.openPinterestDev}
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
        <AlertTitle className="text-red-900">{tp.autoPublishFailed}</AlertTitle>
        <AlertDescription className="text-red-800 text-sm">{lastError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        {fmt(tp.readyToPublish, { count: pendingCount })}
      </AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span className="text-amber-800 text-sm">
          {isPublishing ? tp.autoPublishing : lastError ? lastError : tp.readyToPublishDesc}
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
              {tp.publishing}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {tp.publishNow}
            </>
          )}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
