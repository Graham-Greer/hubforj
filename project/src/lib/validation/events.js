function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

function assertEnum(value, allowed, field) {
  if (!allowed.includes(value)) {
    throw new Error(`${field} is invalid.`);
  }
}

function parseStringArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const raw = String(value || "").trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseImageIds(value) {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const raw = String(value);
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item || "").trim()).filter(Boolean);
    }
  } catch {
    // Continue to comma-separated fallback.
  }

  return parseStringArray(raw);
}

function parseDateTime(value, field) {
  const input = String(value || "").trim();
  if (!input) {
    throw new Error(`${field} is required.`);
  }

  const withSeconds = input.length === 16 ? `${input}:00` : input;
  const normalized = withSeconds.length === 19 ? `${withSeconds}Z` : withSeconds;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} is invalid.`);
  }

  return date.toISOString();
}

function parseCapacity(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 1 || !Number.isInteger(number)) {
    throw new Error("capacity must be a positive integer.");
  }
  return number;
}

function parsePrice(value, pricingMode) {
  if (pricingMode === "free") return null;
  const raw = String(value ?? "").trim();
  if (!raw) {
    throw new Error("price is required for paid events.");
  }
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 0) {
    throw new Error("price is required for paid events.");
  }
  return number;
}

function parseStatus(value) {
  const status = String(value || "").trim();
  if (!status) return "draft";
  assertEnum(status, ["draft", "published", "cancelled"], "status");
  return status;
}

export function validateEventInput(input) {
  const payload = input || {};

  const title = String(payload.title || "").trim();
  if (!title) throw new Error("title is required.");

  const description = String(payload.description || "").trim();
  if (!description) throw new Error("description is required.");

  const startAt = parseDateTime(payload.startAt, "startAt");
  const endAt = parseDateTime(payload.endAt, "endAt");
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    throw new Error("endAt must be after startAt.");
  }

  const location = String(payload.location || "").trim();
  if (!location) throw new Error("location is required.");

  const category = String(payload.category || "").trim();
  assertEnum(category, ["Workshop", "Meetup", "Course"], "category");

  const pricingMode = String(payload.pricingMode || "").trim();
  assertEnum(pricingMode, ["free", "paid"], "pricingMode");

  const registrationEligibility = String(payload.registrationEligibility || "").trim();
  assertEnum(registrationEligibility, ["members-only", "guests-allowed"], "registrationEligibility");

  const visibility = String(payload.visibility || "").trim();
  assertEnum(visibility, ["public", "members-only"], "visibility");

  const slug = normalizeSlug(payload.slug || title);
  if (!slug) throw new Error("slug is invalid.");

  return {
    slug,
    status: parseStatus(payload.status),
    title,
    description,
    imageMediaIds: parseImageIds(payload.imageMediaIds),
    startAt,
    endAt,
    location,
    capacity: parseCapacity(payload.capacity),
    category,
    tags: parseStringArray(payload.tags),
    pricingMode,
    price: parsePrice(payload.price, pricingMode),
    registrationEligibility,
    visibility,
  };
}

export function validateEventStatusTransition(currentStatus, nextStatus, hasRegistrations = false) {
  const current = String(currentStatus || "").trim();
  const next = String(nextStatus || "").trim();

  assertEnum(current, ["draft", "published", "cancelled"], "current status");
  assertEnum(next, ["draft", "published", "cancelled"], "next status");

  if (current === next) return next;

  if (current === "draft" && next === "published") return next;
  if (current === "published" && next === "cancelled") return next;

  if (current === "published" && next === "draft" && hasRegistrations) {
    throw new Error("Cannot move published event back to draft after registrations exist.");
  }

  throw new Error(`Invalid event status transition: ${current} -> ${next}`);
}

export function validateEventRouteInput(input) {
  const payload = input || {};
  const hubSlug = String(payload.hubSlug || "").trim();
  const eventId = String(payload.eventId || "").trim();

  if (!hubSlug) throw new Error("hubSlug is required.");
  if (!eventId) throw new Error("eventId is required.");
  return { hubSlug, eventId };
}
