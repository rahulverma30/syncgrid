/**
 * useOutsideClick hook
 * Detect clicks outside an element
 */

'use client';

import { useEffect, useRef } from 'react';

export function useOutsideClick(
  callback: () => void,
  exceptions: (HTMLElement | null)[] = []
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside ref and not in exceptions
      const isOutside = ref.current && !ref.current.contains(target);
      const isException = exceptions.some((el) => el && el.contains(target));

      if (isOutside && !isException) {
        callback();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [callback, exceptions]);

  return ref;
}
