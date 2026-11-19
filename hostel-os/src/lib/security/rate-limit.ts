interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter
 * @param key unique identifier (e.g. IP or IP+route)
 * @param limit maximum allowed requests in window
 * @param windowSeconds time window in seconds
 */
export function checkRateLimit(
  key: string,
  limit = 60,
  windowSeconds = 60
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || record.resetAt <= now) {
    const resetAt = now + windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

