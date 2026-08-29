import { useEffect, useState } from 'react';
import {
  fetchAiStatus,
  hasIdeogramKey,
  hasOpenRouterKey,
  type AiStatus,
} from '@/lib/ai';

export function useAiStatus(): AiStatus {
  const [status, setStatus] = useState<AiStatus>({
    hasTextAi: hasOpenRouterKey,
    hasImageAi: hasIdeogramKey,
  });

  useEffect(() => {
    void fetchAiStatus().then(setStatus);
  }, []);

  return status;
}
