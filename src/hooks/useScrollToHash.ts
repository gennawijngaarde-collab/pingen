import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll vers l’ancre après navigation (ex. /#pricing depuis une page légale). */
export function useScrollToHash() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [hash]);
}
