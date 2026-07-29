function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

const publicEnv = {
  firebaseApiKey: String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim(),
  firebaseAuthDomain: String(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim(),
  firebaseProjectId: String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
  firebaseStorageBucket: String(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim(),
  firebaseMessagingSenderId: String(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  firebaseAppId: String(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim(),
  stripePublishableKey: String(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "").trim(),
};

const serverEnv = {
  productSiteBaseUrl: normalizeBaseUrl(process.env.PRODUCT_SITE_BASE_URL || ""),
  hubPlatformBaseUrl: normalizeBaseUrl(process.env.HUB_PLATFORM_BASE_URL || ""),
  internalAutomationSecret: String(
    process.env.INTERNAL_AUTOMATION_SECRET ||
      (process.env.NODE_ENV === "production" ? "" : process.env.INTERNAL_AUTOMATION_TOKEN) ||
      ""
  ).trim(),
  productSiteSessionSecret: String(process.env.PRODUCT_SITE_SESSION_SECRET || "").trim(),
  productSiteAbuseRateLimitProvider: String(process.env.PRODUCT_SITE_ABUSE_RATE_LIMIT_PROVIDER || "").trim(),
  productSiteAbuseRateLimitFailClosed:
    String(process.env.PRODUCT_SITE_ABUSE_RATE_LIMIT_FAIL_CLOSED || "").trim().toLowerCase() === "true",
  upstashRedisRestUrl: String(process.env.UPSTASH_REDIS_REST_URL || "").trim(),
  upstashRedisRestToken: String(process.env.UPSTASH_REDIS_REST_TOKEN || "").trim(),
  resendApiKey: String(process.env.RESEND_API_KEY || "").trim(),
  resendFromEmail: String(process.env.RESEND_FROM_EMAIL || "").trim(),
  stripeSecretKey: String(process.env.STRIPE_SECRET_KEY || "").trim(),
  stripeWebhookSecret: String(process.env.STRIPE_WEBHOOK_SECRET || "").trim(),
  stripeStarterGbpPriceId: String(process.env.STRIPE_PRICE_STARTER_GBP_MONTHLY || "").trim(),
  stripeGrowthGbpPriceId: String(process.env.STRIPE_PRICE_GROWTH_GBP_MONTHLY || "").trim(),
  stripeBillingPortalConfigurationId: String(process.env.STRIPE_BILLING_PORTAL_CONFIGURATION_ID || "").trim(),
  firebaseAdminProjectId: String(process.env.FIREBASE_ADMIN_PROJECT_ID || "").trim(),
  firebaseAdminClientEmail: String(process.env.FIREBASE_ADMIN_CLIENT_EMAIL || "").trim(),
  firebaseAdminPrivateKey: String(process.env.FIREBASE_ADMIN_PRIVATE_KEY || "").trim(),
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
  };
}

export function assertServerEnv() {
  const config = getServerEnv();
  const required = {
    FIREBASE_ADMIN_PROJECT_ID: config.firebaseAdminProjectId,
    FIREBASE_ADMIN_CLIENT_EMAIL: config.firebaseAdminClientEmail,
    FIREBASE_ADMIN_PRIVATE_KEY: config.firebaseAdminPrivateKey,
  };
  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
  }

  return config;
}
