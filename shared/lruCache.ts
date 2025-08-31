// shared/lruCache.ts
// A simple generic LRU (Least Recently Used) cache implementation.

export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number) {
    if (maxSize <= 0) {
      throw new Error('LRUCache: maxSize must be greater than 0');
    }
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  /**
   * Retrieve a value by key, marking it as recently used.
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    const value = this.cache.get(key)!;
    // Refresh order
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Insert or update a key-value pair, evicting the least recently used if over capacity.
   */
  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, value);
    if (this.cache.size > this.maxSize) {
      // Evict oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Check if a key exists in the cache.
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a key from the cache.
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  /**
   * Remove all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }
}

