/**
 * Enterprise Hybrid Analytics Cache Layer
 * Multi-tenant safe, TTL-aware, namespace-isolated query cache.
 * Designed to fall back to memory cache locally or integrate seamlessly with Redis/Memcached.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-Memory Cache Store (Fallback for local MongoDB environments)
const memoryStore = new Map<string, CacheEntry<any>>();

/**
 * Builds a deterministic query hash key under tenant-isolated namespaces
 */
function buildCacheKey(
  companyId: string,
  namespace: string,
  queryObj: Record<string, any>
): string {
  // Sort keys to guarantee identical hashes for different key ordering
  const sortedString = JSON.stringify(queryObj, Object.keys(queryObj).sort());
  return `tenant:${companyId}:ns:${namespace}:hash:${sortedString}`;
}

export const analyticsCache = {
  /**
   * Retrieves a cached aggregated dataset for a specific tenant
   */
  async get<T>(
    companyId: string,
    namespace: string,
    queryObj: Record<string, any>
  ): Promise<T | null> {
    const key = buildCacheKey(companyId, namespace, queryObj);
    const cached = memoryStore.get(key);

    if (!cached) {
      return null;
    }

    // TTL Expiration Check
    if (Date.now() > cached.expiresAt) {
      memoryStore.delete(key);
      return null;
    }

    return cached.value as T;
  },

  /**
   * Caches an aggregated result for a tenant with custom TTL (defaults to 10 minutes)
   */
  async set<T>(
    companyId: string,
    namespace: string,
    queryObj: Record<string, any>,
    value: T,
    ttlSeconds = 600
  ): Promise<void> {
    const key = buildCacheKey(companyId, namespace, queryObj);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    memoryStore.set(key, { value, expiresAt });
  },

  /**
   * Invalidates all cache segments for a tenant or specific namespace
   */
  async invalidate(companyId: string, namespace?: string): Promise<void> {
    const keysToDelete: string[] = [];
    const prefix = namespace ? `tenant:${companyId}:ns:${namespace}:` : `tenant:${companyId}:`;

    memoryStore.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => memoryStore.delete(key));
  },
};
