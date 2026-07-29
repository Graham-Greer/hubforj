import {
  applyScheduledMembershipDefaultPlanDowngrade,
  listDueScheduledMembershipDefaultPlanDowngrades,
} from "@/lib/data/memberships";

function normalizeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function processScheduledMembershipChanges({
  now = new Date(),
  batchSize = 50,
  actorId = "internal-automation",
} = {}) {
  const normalizedBatchSize = Math.max(1, normalizeInteger(batchSize, 50));
  const dueMemberships = await listDueScheduledMembershipDefaultPlanDowngrades(now, normalizedBatchSize);
  const results = [];

  for (const membership of dueMemberships) {
    try {
      const applied = await applyScheduledMembershipDefaultPlanDowngrade(membership, actorId);
      results.push({
        membershipId: membership.id,
        hubId: membership.hubId,
        userId: membership.userId,
        status: "applied",
        appliedMembershipId: applied.id,
      });
    } catch (error) {
      results.push({
        membershipId: membership.id,
        hubId: membership.hubId,
        userId: membership.userId,
        status: "failed",
        error: String(error?.message || "Unable to apply scheduled membership change."),
      });
    }
  }

  return {
    claimed: dueMemberships.length,
    applied: results.filter((result) => result.status === "applied").length,
    failed: results.filter((result) => result.status === "failed").length,
    results,
  };
}
