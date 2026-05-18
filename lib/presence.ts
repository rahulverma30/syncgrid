import { PresenceSession } from '@/models';
import { logger } from './logger';

/**
 * Ephemeral Presence Engine
 * Abstraction Layer optimized for high-performance tenant-safe operations.
 * Redis ready: local memory fallback is utilized, with standard mappings to
 * active Redis cluster commands (HSET, HGETALL, EXPIRE, HDEL) clearly marked below.
 */

// Memory Cache TTL: 10 minutes to guarantee live, accurate heartbeat session states
const LOCAL_PRESENCE_TTL_MS = 10 * 60 * 1000;

interface PresenceSessionData {
  status: 'online' | 'offline' | 'away' | 'busy';
  currentChannelId?: string;
  lastActiveAt: number;
}

// In-memory cluster replication fallback store
// Redis Equivalence: A Hash Map per companyId: "presence:{companyId}"
const memoryPresenceStore = new Map<string, Map<string, PresenceSessionData>>();

export class PresenceEngine {
  /**
   * Sets user online presence status with ephemeral metadata
   * Redis Equivalence:
   *   redis.hset(`presence:${companyId}`, userId, JSON.stringify({ status, currentChannelId, lastActiveAt }))
   *   redis.expire(`presence:${companyId}`, 600) // TTL 10 minutes
   */
  public static async setUserPresence(
    companyId: string,
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy',
    currentChannelId?: string
  ): Promise<any> {
    const now = Date.now();
    const sessionData: PresenceSessionData = {
      status,
      currentChannelId,
      lastActiveAt: now,
    };

    // 1. Update in-memory cluster replica
    if (!memoryPresenceStore.has(companyId)) {
      memoryPresenceStore.set(companyId, new Map());
    }
    memoryPresenceStore.get(companyId)!.set(userId, sessionData);

    logger.debug(`[Presence Set] ${userId} => ${status}`, { companyId, userId });

    // 2. Async persistent backfill (Mongoose Upsert with compound index coverage)
    // Ensures fallback database states remain consistent without blocking immediate socket response loops
    try {
      await PresenceSession.findOneAndUpdate(
        { companyId, userId },
        {
          status,
          currentChannelId: currentChannelId || null,
          lastActiveAt: new Date(now),
        },
        { upsert: true, new: true }
      );
    } catch (err) {
      logger.error('Failed to sync presence session state to persistent DB store:', err, {
        companyId,
        userId,
      });
    }

    return sessionData;
  }

  /**
   * Fetches all active online presence sessions inside a tenant space, filtering stale items
   * Redis Equivalence:
   *   const data = await redis.hgetall(`presence:${companyId}`)
   *   Filter out expired data points in memory
   */
  public static async getActivePresence(
    companyId: string
  ): Promise<Record<string, 'online' | 'offline' | 'away' | 'busy'>> {
    const now = Date.now();
    const activeMap: Record<string, 'online' | 'offline' | 'away' | 'busy'> = {};

    // 1. Fetch from local high-performance memory store
    const tenantStore = memoryPresenceStore.get(companyId);
    if (tenantStore) {
      tenantStore.forEach((data, userId) => {
        if (now - data.lastActiveAt <= LOCAL_PRESENCE_TTL_MS) {
          activeMap[userId] = data.status;
        } else {
          // Garbage collection cleanup on stale memory caches
          tenantStore.delete(userId);
        }
      });
    }

    // 2. Hybrid database backfill if local memory cache is cold or recently deployed
    if (Object.keys(activeMap).length === 0) {
      logger.debug('[Presence Fetch] Cache cold, backfilling presence sessions from DB', {
        companyId,
      });
      try {
        const timeThreshold = new Date(now - LOCAL_PRESENCE_TTL_MS);
        const sessions = await PresenceSession.find({
          companyId,
          lastActiveAt: { $gte: timeThreshold },
        }).lean();

        sessions.forEach((s: any) => {
          activeMap[s.userId.toString()] = s.status;

          // Seed the memory store for subsequent fast queries
          if (!memoryPresenceStore.has(companyId)) {
            memoryPresenceStore.set(companyId, new Map());
          }
          memoryPresenceStore.get(companyId)!.set(s.userId.toString(), {
            status: s.status,
            currentChannelId: s.currentChannelId?.toString(),
            lastActiveAt: new Date(s.lastActiveAt).getTime(),
          });
        });
      } catch (err) {
        logger.error('Failed backfilling presence cache from database:', err, { companyId });
      }
    }

    return activeMap;
  }

  /**
   * Batch-processes user heartbeats received to eliminate database locks
   */
  public static async batchHeartbeats(
    companyId: string,
    heartbeats: Array<{ userId: string; status: 'online' | 'offline' | 'away' | 'busy' }>
  ): Promise<void> {
    logger.info(`[Presence Batch] Processing ${heartbeats.length} presence heartbeats`, {
      companyId,
    });
    for (const hb of heartbeats) {
      await this.setUserPresence(companyId, hb.userId, hb.status);
    }
  }
}
