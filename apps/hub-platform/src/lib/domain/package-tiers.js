function normalizeString(value) {
  return String(value || "").trim().toLowerCase();
}

export const packageTierLabels = {
  free: "Free",
  starter: "Starter",
  growth: "Growth",
};

export const packageTierOptions = [
  { value: "free", label: packageTierLabels.free },
  { value: "starter", label: packageTierLabels.starter },
  { value: "growth", label: packageTierLabels.growth },
];

export const packageStatusLabels = {
  active: "Active",
  trialing: "Trialing",
  past_due: "Past due",
  cancelled: "Cancelled",
};

export const packageSourceLabels = {
  product_site: "Product site",
  operator: "Operator",
  seed: "Seed",
};

export function normalizePackageTier(value, fallback = "starter") {
  const normalized = normalizeString(value);

  if (normalized === "free" || normalized === "starter" || normalized === "growth") {
    return normalized;
  }

  return fallback;
}

export function normalizePackageStatus(value, fallback = "active") {
  const normalized = normalizeString(value);

  if (normalized === "active" || normalized === "trialing" || normalized === "past_due" || normalized === "cancelled") {
    return normalized;
  }

  return fallback;
}

export function normalizePackageSource(value, fallback = "operator") {
  const normalized = normalizeString(value).replace(/-/g, "_");

  if (normalized === "product_site" || normalized === "operator" || normalized === "seed") {
    return normalized;
  }

  return fallback;
}

export function getPackageTierLabel(tier) {
  return packageTierLabels[normalizePackageTier(tier)] || packageTierLabels.starter;
}

export function getPackageStatusLabel(status) {
  return packageStatusLabels[normalizePackageStatus(status)] || packageStatusLabels.active;
}

export function getPackageSourceLabel(source) {
  return packageSourceLabels[normalizePackageSource(source)] || packageSourceLabels.operator;
}
