interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Run background garbage collector every 10 minutes to prune stale records and avoid memory leaks
if (typeof window === 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      const maxWindow = 60 * 60 * 1000; // 1 hour maximum track window
      for (const [key, record] of memoryStore.entries()) {
        record.timestamps = record.timestamps.filter((t) => now - t < maxWindow);
        if (record.timestamps.length === 0) {
          memoryStore.delete(key);
        }
      }
    },
    10 * 60 * 1000
  );
}

/**
 * Sliding Window Rate Limiter
 * Tracks and limits access based on request timestamps.
 *
 * @param key Unique identifier (e.g., action:ip)
 * @param limit Max allowed requests within the sliding window
 * @param windowMs Time window in milliseconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Filter timestamps to only retain those inside the current sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    reset: now + windowMs,
  };
}
