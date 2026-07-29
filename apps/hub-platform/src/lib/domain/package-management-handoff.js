import { getServerEnv } from "@/lib/config/env";

function normalizeString(value) {
  return String(value || "").trim();
}

function normalizeBaseUrl(value) {
  return normalizeString(value).replace(/\/+$/, "");
}

function buildProductSiteHref(baseUrl, pathname, params) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!normalizedBaseUrl) {
    return "";
  }

  const searchParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    const normalizedValue = normalizeString(value);

    if (normalizedValue) {
      searchParams.set(key, normalizedValue);
    }
  });

  const query = searchParams.toString();

  return `${normalizedBaseUrl}${pathname}${query ? `?${query}` : ""}`;
}

export function resolvePackageManagementHandoff({
  hubId = "",
  hubSlug = "",
  returnPath = "",
} = {}) {
  const { productSiteBaseUrl } = getServerEnv();

  const params = {
    hubId,
    hubSlug,
    returnTo: returnPath,
  };

  const managePackageHref = buildProductSiteHref(productSiteBaseUrl, "/account/package", params);
  const upgradeToGrowthHref = buildProductSiteHref(productSiteBaseUrl, "/account/upgrade", {
    ...params,
    intent: "upgrade_growth",
  });

  return {
    managePackageHref,
    upgradeToGrowthHref,
    managePackageAvailable: Boolean(managePackageHref),
    upgradeToGrowthAvailable: Boolean(upgradeToGrowthHref),
    placeholder: !managePackageHref && !upgradeToGrowthHref,
  };
}
