/**
 * useMounted hook
 * Ensures component is mounted before rendering (useful for SSR)
 */

'use client';

import { useEffect, useState } from 'react';

export function useMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
