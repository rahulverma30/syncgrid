import { useEffect } from 'react';

export function useLockBodyScroll(lock: boolean) {
  useEffect(() => {
    if (!lock) return;

    // Get original body overflow
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

    // Prevent scrolling on mount
    document.body.style.overflow = 'hidden';

    // Add padding to prevent layout shift if there's a scrollbar
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Re-enable scrolling when component unmounts or lock changes
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [lock]);
}
