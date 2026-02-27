'use client';

import { useEffect } from 'react';

/**
 * When the user is logged in, fetches the session token (same-origin, so cookies are sent)
 * and posts it to the page so the Synapse extension's content script can store it.
 * The extension then sends this token with save requests (cookies are not sent from extension origin).
 */
export default function ExtensionTokenBroadcast() {
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch('/api/extension/token', { credentials: 'include' });
        if (cancelled || !res.ok) return;
        const data = await res.json();
        if (data?.access_token && typeof window !== 'undefined') {
          window.postMessage(
            { type: 'SYNAPSE_EXTENSION_TOKEN', token: data.access_token },
            '*'
          );
        }
      } catch {
        // ignore
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
