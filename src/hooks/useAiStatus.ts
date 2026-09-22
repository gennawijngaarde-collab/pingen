import { useEffect, useState } from 'react';
import {
  fetchAiStatus,
  hasGrokKey,
  hasOpenRouterKey,
  type AiStatus,
} from '@/lib/ai';

export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>({
    hasTextAi: hasOpenRouterKey,
    hasImageAi: hasGrokKey,
  });

  useEffect(() => {
    void fetchAiStatus().then(setStatus);
  }, []);

  return status;
}
