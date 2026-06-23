import NodeCache from 'node-cache';

/**
 * Singleton wrapper around node-cache.
 * Provides typed get/set so services don't need to import NodeCache directly.
 */
class CacheService {
  private cache: NodeCache;

  constructor() {
    // checkperiod: background job runs every 20s to delete expired keys
    this.cache = new NodeCache({ stdTTL: 15, checkperiod: 20 });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttlSeconds?: number): boolean {
    if (ttlSeconds !== undefined) {
      return this.cache.set(key, value, ttlSeconds);
    }
    return this.cache.set(key, value);
  }

  del(key: string): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  stats() {
    return this.cache.getStats();
  }
}

export default new CacheService();