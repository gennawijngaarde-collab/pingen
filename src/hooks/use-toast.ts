import { useCallback } from 'react';
import { toast as sonnerToast } from 'sonner';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);

      if (variant === 'destructive') {
        sonnerToast.error(title, { description, id });
      } else {
        sonnerToast.success(title, { description, id });
      }

      return { id, title, description, variant };
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    sonnerToast.dismiss(id);
  }, []);

  return { toast, toasts: [] as Toast[], dismiss };
}
