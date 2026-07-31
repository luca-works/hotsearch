'use client';

import { useEffect } from 'react';

export function VisitTracker() {
  useEffect(() => {
    void fetch('/api/visits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path: window.location.pathname,
      }),
      keepalive: true,
    }).catch(() => undefined);
  }, []);

  return null;
}
