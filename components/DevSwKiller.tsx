'use client';

import { useEffect } from 'react';

export default function DevSwKiller() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV === 'production') return;

    // Desregistrar todos os service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister().catch(() => {}));
      }).catch(() => {});
    }

    // Limpar caches (Workbox/Next-PWA)
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => caches.delete(k).catch(() => {}));
      }).catch(() => {});
    }
  }, []);

  return null;
}
