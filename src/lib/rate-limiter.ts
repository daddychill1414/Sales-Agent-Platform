/**
 * Simple client-side rate limiter for form submissions.
 * Prevents rapid-fire submissions using a token bucket approach.
 * Per vibecodesecurity: protection against abuse.
 */

interface RateLimiterConfig {
    maxAttempts: number;
    windowMs: number;
}

class RateLimiter {
    private attempts: number[] = [];
    private config: RateLimiterConfig;

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Check if action is allowed. Returns true if under the limit.
     */
    canProceed(): boolean {
        const now = Date.now();
        // Remove expired attempts
        this.attempts = this.attempts.filter(t => now - t < this.config.windowMs);

        if (this.attempts.length >= this.config.maxAttempts) {
            return false;
        }

        this.attempts.push(now);
        return true;
    }

    /**
     * Get time remaining until next attempt is allowed (in seconds).
     */
    getWaitTime(): number {
        if (this.attempts.length === 0) return 0;
        const oldest = this.attempts[0];
        const waitMs = this.config.windowMs - (Date.now() - oldest);
        return Math.max(0, Math.ceil(waitMs / 1000));
    }

    reset() {
        this.attempts = [];
    }
}

// Pre-configured limiters for common use cases
export const loginLimiter = new RateLimiter({ maxAttempts: 5, windowMs: 60000 });     // 5 per minute
export const applicationLimiter = new RateLimiter({ maxAttempts: 3, windowMs: 300000 }); // 3 per 5 min
export const uploadLimiter = new RateLimiter({ maxAttempts: 10, windowMs: 60000 });    // 10 per minute
