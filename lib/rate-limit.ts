import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export const limiters = {
	revealContact: new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(20, "1 h"),
		prefix: "rv:reveal",
	}),
	createListing: new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(5, "1 d"),
		prefix: "rl:listing",
	}),
	createReport: new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(10, "1 d"),
		prefix: "rl:report",
	}),
	signUpload: new Ratelimit({
		redis,
		limiter: Ratelimit.slidingWindow(30, "1 h"),
		prefix: "rl:upload",
	}),
} as const;

export type LimiterName = keyof typeof limiters;

export async function checkRateLimit(
	name: LimiterName,
	userId: string
): Promise<{ ok: true } | { ok: false; retryAfterSeconds: number }> {
	try {
		const { success, reset } = await limiters[name].limit(userId);
		console.log("Rate limit check for", name, "userId:", userId, "success:", success, "reset:", reset);
		if (success) return { ok: true };
		return {
			ok: false,
			retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
		};

	} catch (error) {
		// Redis outage must not take the whole app down. Fail open, but log loudly
		// so it is noticed.
		console.error(`Rate limiter "${name}" failed, allowing request:`, error);
		return { ok: true };
	}
}