'use client';

import { useEffect } from 'react';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const BUNDLE_RE = /\/assets\/(index-[A-Za-z0-9_-]+\.js)/;

function currentBundle(): string | null {
  for (const script of Array.from(document.scripts)) {
    const match = script.src.match(BUNDLE_RE);
    if (match) return match[1];
  }
  return null;
}

/**
 * Reloads long-lived tabs when a new build has been deployed, so background
 * workers (autopilot, scheduler) never keep running outdated logic.
 */
export function VersionWatcher() {
  useEffect(() => {
    const running = currentBundle();
    if (!running) return;
    let checking = false;

    const check = async () => {
      if (checking || document.visibilityState !== 'visible') return;
      checking = true;
      try {
        const res = await fetch(`/?_v=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'text/html' } });
        if (!res.ok) return;
        const deployed = (await res.text()).match(BUNDLE_RE)?.[1];
        if (deployed && deployed !== running) window.location.reload();
      } catch {
        // Offline or blocked: try again later.
      } finally {
        checking = false;
      }
    };

    const timer = setInterval(() => void check(), CHECK_INTERVAL_MS);
    const onVisible = () => void check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return null;
}
