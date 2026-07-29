import "server-only";

import crypto from "node:crypto";
import { getServerEnv } from "@/lib/config/env";

const defaultLimiterProvider = process.env.NODE_ENV === "production" ? "memory" : "disabled";
const rateLimitScopes = {
  hubMemberJoin: {
    label: "hub member join",
    limits: [
      { key: "ipHub", maxAttempts: 10, windowSeconds: 15 * 60 },
      { key: "emailHub", maxAttempts: 5, windowSeconds: 60 * 60 },
    ],
    message: "Too many join attempts. Please wait a little while and try again.",
  },
};

const memoryStore = globalThis.__hubforjHubPlatformRateLimitStore || new Map();
globalThis.__hubforjHubPlatformRateLimitStore = memoryStore;

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeProvider(value) {
  const normalized = normalizeString(value).toLowerCase();

  if (["disabled", "memory", "upstash"].includes(normalized)) {
    return normalized;
  }

  return defaultLimiterProvider;
}

function hashValue(value) {
  const normalizedValue = normalizeString(value).toLowerCase();

  if (!normalizedValue) {
    return "";
  }

  return crypto.createHash("sha256").update(normalizedValue).digest("hex").slice(0, 32);
}

function firstHeaderValue(value) {
  return normalizeString(value).split(",")[0]?.trim() || "";
}

export function resolveClientIpFromRequest(request) {
  const candidates = [
    request.headers.get("cf-connecting-ip"),
    request.headers.get("x-real-ip"),
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
  ];

  for (const candidate of candidates) {
    const resolved = firstHeaderValue(candidate);

    if (resolved) {
      return resolved;
    }
  }

  return "unknown";
}

function buildRateLimitKey({ scope, part, value }) {
  return ["hub-platform", "abuse", scope, part, hashValue(value) || "unknown"].join(":");
}

function getMemoryBucket(key, now, windowSeconds) {
  const existing = memoryStore.get(key);

  if (existing && existing.resetAt > now) {
    return existing;
  }

  const nextBucket = {
    count: 0,
    resetAt: now + windowSeconds * 1000,
  };

  memoryStore.set(key, nextBucket);
  return nextBucket;
}

async function consumeMemoryRateLimit({ key, maxAttempts, windowSeconds }) {
  const now = Date.now();
  const bucket = getMemoryBucket(key, now, windowSeconds);

  bucket.count += 1;

  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

  return {
    allowed: bucket.count <= maxAttempts,
    limit: maxAttempts,
    remaining: Math.max(0, maxAttempts - bucket.count),
    retryAfterSeconds,
  };
}

async function consumeUpstashRateLimit({ key, maxAttempts, windowSeconds, config }) {
  const response = await fetch(`${config.upstashRedisRestUrl.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.upstashRedisRestToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds, "NX"],
      ["TTL", key],
    ]),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit request failed with status ${response.status}.`);
  }

  const results = await response.json();
  const count = Number.parseInt(String(results?.[0]?.result || "0"), 10) || 0;
  const ttl = Number.parseInt(String(results?.[2]?.result || windowSeconds), 10) || windowSeconds;

  return {
    allowed: count <= maxAttempts,
    limit: maxAttempts,
    remaining: Math.max(0, maxAttempts - count),
    retryAfterSeconds: Math.max(1, ttl),
  };
}

async function consumeRateLimit(args) {
  const config = getServerEnv();
  const provider = normalizeProvider(config.hubPlatformAbuseRateLimitProvider);

  if (provider === "disabled") {
    return {
      allowed: true,
      limit: args.maxAttempts,
      remaining: args.maxAttempts,
      retryAfterSeconds: args.windowSeconds,
    };
  }

  if (provider === "upstash" && config.upstashRedisRestUrl && config.upstashRedisRestToken) {
    try {
      return await consumeUpstashRateLimit({ ...args, config });
    } catch (error) {
      if (config.hubPlatformAbuseRateLimitFailClosed) {
        throw error;
      }

      console.warn("[hub-platform] Upstash rate limit unavailable; allowing request.", error);
      return {
        allowed: true,
        limit: args.maxAttempts,
        remaining: args.maxAttempts,
        retryAfterSeconds: args.windowSeconds,
      };
    }
  }

  return consumeMemoryRateLimit(args);
}

export class PublicAbuseRateLimitError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "PublicAbuseRateLimitError";
    this.userMessage = message;
    this.retryAfterSeconds = details.retryAfterSeconds || 0;
    this.scope = details.scope || "";
    this.part = details.part || "";
  }
}

export function isPublicAbuseRateLimitError(error) {
  return error instanceof PublicAbuseRateLimitError || error?.name === "PublicAbuseRateLimitError";
}

export async function assertPublicAbuseAllowed(scope, values = {}) {
  const scopeConfig = rateLimitScopes[scope];

  if (!scopeConfig) {
    throw new Error(`Unknown public abuse control scope: ${scope}`);
  }

  const keyValues = {
    ipHub: `${normalizeString(values.ipAddress) || "unknown"}:${normalizeString(values.hubSlug).toLowerCase() || "unknown"}`,
    emailHub: values.email ? `${normalizeString(values.email).toLowerCase()}:${normalizeString(values.hubSlug).toLowerCase() || "unknown"}` : "",
  };

  for (const limit of scopeConfig.limits) {
    const value = keyValues[limit.key];

    if (!value) {
      continue;
    }

    const result = await consumeRateLimit({
      key: buildRateLimitKey({ scope, part: limit.key, value }),
      maxAttempts: limit.maxAttempts,
      windowSeconds: limit.windowSeconds,
    });

    if (!result.allowed) {
      throw new PublicAbuseRateLimitError(scopeConfig.message, {
        retryAfterSeconds: result.retryAfterSeconds,
        scope,
        part: limit.key,
      });
    }
  }
}

export async function assertHubMemberJoinAllowed(values = {}) {
  return assertPublicAbuseAllowed("hubMemberJoin", values);
}
