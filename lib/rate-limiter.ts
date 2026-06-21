import { NextRequest } from "next/server";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyGenerator?: (req: NextRequest) => string;
}

const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest) => {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      const key = config.keyGenerator?.(req) || ip;
      const now = Date.now();

      let record = store.get(key);

      if (!record || now > record.resetTime) {
        record = {
          count: 0,
          resetTime: now + config.windowMs,
        };
      }

      record.count++;
      store.set(key, record);

      if (record.count > config.maxRequests) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again later.",
            isRateLimit: true,
            retryAfter: Math.ceil((record.resetTime - now) / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil((record.resetTime - now) / 1000).toString(),
            },
          }
        );
      }

      return handler(req);
    };
  };
}
