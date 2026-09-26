import { useEffect, useState } from 'react';
import { fetchAiStatus, type AiStatus } from '@/lib/ai';

export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>({ hasTextAi: false, hasImageAi: false });

  useEffect(() => {
    let cancelled = false;
    void fetchAiStatus().then((next) => {
      if (!cancelled) setStatus(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
