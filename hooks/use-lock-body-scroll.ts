import { useEffect } from 'react';

// Shared global locks tracking variables to safely support stacked nested modals
let lockCount = 0;
let originalOverflow = '';
let originalPaddingRight = '';
let originalHtmlOverflow = '';

export function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    if (lockCount === 0) {
      // Capture and store initial styling values
      originalOverflow = document.body.style.overflow || '';
      originalPaddingRight = document.body.style.paddingRight || '';
      originalHtmlOverflow = document.documentElement.style.overflow || '';

      // Stop scrolling on background document and html
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';

      // Avoid layout shifts by compensating for scrollbar widths
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
    }

    // Increment global locks counter
    lockCount += 1;

    return () => {
      // Decrement locks counter and restore styling when all active locks are cleared
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.documentElement.style.overflow = originalHtmlOverflow;
      }
    };
  }, [lock]);
}
