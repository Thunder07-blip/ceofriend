// ============================================================
// CEOfriend — In-Memory Cache Service
// No Redis, no external dependencies. Simple JS Map with TTL.
// ============================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class CacheService {
  private store = new Map<string, CacheEntry<unknown>>();

  /**
   * Get a cached value. Returns null if not found or expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with optional TTL.
   */
  set<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Check if a key exists and is not expired.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove a specific key.
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get the number of cached entries (including possibly expired ones).
   */
  get size(): number {
    return this.store.size;
  }
}

// Singleton instance
export const cache = new CacheService();
