function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const publicEnv = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
};

const serverEnv = {
  firebaseAdminProjectId: process.env.FIREBASE_ADMIN_PROJECT_ID || "",
  firebaseAdminClientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "",
  firebaseAdminPrivateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY || "",
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || "",
  hubPlatformBaseUrl: normalizeBaseUrl(process.env.HUB_PLATFORM_BASE_URL || ""),
  platformReservedHosts: process.env.PLATFORM_RESERVED_HOSTS || "",
  productSiteBaseUrl: process.env.PRODUCT_SITE_BASE_URL || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendFromEmail: process.env.RESEND_FROM_EMAIL || "",
  hubPlatformAbuseRateLimitProvider: process.env.HUB_PLATFORM_ABUSE_RATE_LIMIT_PROVIDER || "",
  hubPlatformAbuseRateLimitFailClosed:
    String(process.env.HUB_PLATFORM_ABUSE_RATE_LIMIT_FAIL_CLOSED || "").trim().toLowerCase() === "true",
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || "",
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || "",
  hubforjPlatformFeeBps: process.env.HUBFORJ_PLATFORM_FEE_BPS || "",
  internalAutomationSecret: process.env.INTERNAL_AUTOMATION_SECRET || "",
  internalAutomationProcessorBatchSize: process.env.INTERNAL_AUTOMATION_PROCESSOR_BATCH_SIZE || "",
  sessionHmacSecret: process.env.SESSION_HMAC_SECRET || "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
};

export function getPublicEnv() {
  return publicEnv;
}

export function assertPublicEnv() {
  const required = {
    NEXT_PUBLIC_FIREBASE_API_KEY: publicEnv.firebaseApiKey,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: publicEnv.firebaseAuthDomain,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: publicEnv.firebaseProjectId,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: publicEnv.firebaseStorageBucket,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: publicEnv.firebaseMessagingSenderId,
    NEXT_PUBLIC_FIREBASE_APP_ID: publicEnv.firebaseAppId,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing public environment variables: ${missing.join(", ")}`);
  }

  return publicEnv;
}

export function getServerEnv() {
  return {
    ...serverEnv,
    firebaseAdminPrivateKey: serverEnv.firebaseAdminPrivateKey.replace(/\\n/g, "\n"),
    hubforjPlatformFeeBps: Number.parseInt(String(serverEnv.hubforjPlatformFeeBps || ""), 10) || 0,
    internalAutomationProcessorBatchSize:
      Number.parseInt(String(serverEnv.internalAutomationProcessorBatchSize || ""), 10) || 50,
    platformReservedHosts: serverEnv.platformReservedHosts
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

export function assertServerEnv() {
  const config = getServerEnv();
  const required = {
    FIREBASE_ADMIN_PROJECT_ID: config.firebaseAdminProjectId,
    FIREBASE_ADMIN_CLIENT_EMAIL: config.firebaseAdminClientEmail,
    FIREBASE_ADMIN_PRIVATE_KEY: config.firebaseAdminPrivateKey,
    SESSION_HMAC_SECRET: config.sessionHmacSecret,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  return config;
}
