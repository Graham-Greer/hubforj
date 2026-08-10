import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBoolean(value) {
  return value === true;
}

function resolveEnv(overrides) {
  return overrides || getServerEnv();
}

export function getCustomDomainVercelConfig(overrides = null) {
  const env = resolveEnv(overrides);
  const apiToken = normalizeString(env.vercelApiToken);
  const projectId = normalizeString(env.vercelHubPlatformProjectId);
  const teamId = normalizeString(env.vercelTeamId);
  const timeoutMs = Number.isFinite(Number(env.hubPlatformCustomDomainVercelTimeoutMs))
    ? Math.min(Math.max(Number(env.hubPlatformCustomDomainVercelTimeoutMs), 1000), 30000)
    : 5000;

  return {
    apiToken,
    projectId,
    teamId,
    enabled: normalizeBoolean(env.hubPlatformCustomDomainVercelEnabled),
    autoActivateEnabled: normalizeBoolean(env.hubPlatformCustomDomainAutoActivateEnabled),
    timeoutMs,
  };
}

export function getCustomDomainVercelDiagnostics(overrides = null) {
  const config = getCustomDomainVercelConfig(overrides);

  return {
    configured: Boolean(config.apiToken && config.projectId),
    enabled: config.enabled,
    autoActivateEnabled: config.autoActivateEnabled,
    projectConfigured: Boolean(config.projectId),
    projectId: config.projectId,
    teamConfigured: Boolean(config.teamId),
    accountScope: config.teamId ? "team" : "personal",
    tokenConfigured: Boolean(config.apiToken),
    timeoutMs: config.timeoutMs,
  };
}

export function assertCustomDomainVercelConfigured() {
  const config = getCustomDomainVercelConfig();

  if (!config.apiToken) {
    throw new Error("Vercel API token is not configured.");
  }

  if (!config.projectId) {
    throw new Error("Vercel hub-platform project id is not configured.");
  }

  return config;
}
