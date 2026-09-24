import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

export function AutoPublisher() {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkPendingPins = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('pins')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .lte('scheduled_at', now);
      
      setPendingCount(data?.length || 0);
    };

    checkPendingPins();
    const interval = setInterval(checkPendingPins, 30000); // Check every 30s

    return () => clearInterval(interval);
  }, [user]);

  const publishAll = async () => {
    if (!user) return;
    
    setIsPublishing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const response = await fetch('/api/publish-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.successful) {
        setPendingCount(0);
        window.dispatchEvent(new Event('pingen:pins-changed'));
      }
    } catch (error) {
      console.error('Auto-publish error:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  if (pendingCount === 0) return null;

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <Clock className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-900">
        {pendingCount} pin(s) prêt(s) à publier
      </AlertTitle>
      <AlertDescription className="flex items-center gap-3 mt-2">
        <span className="text-amber-800 text-sm">
          Ces pins sont planifiés pour maintenant ou avant. Cliquez pour les publier sur Pinterest.
        </span>
        <Button
          size="sm"
          onClick={publishAll}
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
