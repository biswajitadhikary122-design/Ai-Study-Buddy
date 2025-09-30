interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export class SimpleCache<T> {
    private cache = new Map<string, CacheEntry<T>>();

    get(key: string): T | null {
        const entry = this.cache.get(key);
        if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
            // Entry is valid
            return entry.data;
        }
        
        // Entry expired or doesn't exist
        if (entry) {
            this.cache.delete(key);
        }
        return null;
    }

    set(key: string, data: T): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
        };
        this.cache.set(key, entry);
    }

    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (entry && (Date.now() - entry.timestamp < CACHE_TTL)) {
            return true;
        }
        return false;
    }

    clear(): void {
        this.cache.clear();
    }
}
