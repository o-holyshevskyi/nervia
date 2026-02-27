'use client';

import { useState, useEffect } from 'react';

const EXTENSION_ATTR = 'data-synapse-extension';
const EXTENSION_VALUE = 'installed';

function isExtensionDetected(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.getAttribute(EXTENSION_ATTR) === EXTENSION_VALUE;
}

/**
 * Reactive hook that detects the Nervia Web Clipper extension via the
 * data-synapse-extension attribute on document.documentElement.
 * Uses MutationObserver so the UI updates the moment the extension injects the attribute.
 */
export function useExtensionDetected(): boolean {
  const [detected, setDetected] = useState(false);

  useEffect(() => {
    setDetected(isExtensionDetected());

    const observer = new MutationObserver(() => {
      setDetected(isExtensionDetected());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [EXTENSION_ATTR],
    });

    return () => observer.disconnect();
  }, []);

  return detected;
}
