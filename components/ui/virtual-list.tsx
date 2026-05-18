'use client';

import React, { useState, useEffect, useRef } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  containerHeight?: number; // default height in pixels
}

/**
 * Pure Zero-Dependency React Windowing/Virtual List Component
 * Renders only the visible subset of rows for maximum browser performance.
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight = 400,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const totalHeight = items.length * itemHeight;

  // Calculate visible indices
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2); // 2 rows of overscan/buffer
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + 2
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto w-full relative rounded-2xl border border-slate-850/60 bg-slate-900/10"
      style={{ height: containerHeight }}
    >
      <div className="w-full relative" style={{ height: totalHeight }}>
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          return (
            <div
              key={actualIndex}
              className="absolute left-0 right-0 w-full"
              style={{
                top: actualIndex * itemHeight,
                height: itemHeight,
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
