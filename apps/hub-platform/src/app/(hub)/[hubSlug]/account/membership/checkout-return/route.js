import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentMemberSessionForHub } from "@/lib/auth/member-session";
import { requireHubBySlug } from "@/lib/data/hubs";
import { getRequestHostFromHeaders, resolveHubRuntimeRouteMode } from "@/lib/domain/hub-hosts";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import { finalizeMembershipUpgradeCheckoutReturn } from "@/lib/server/membership-upgrade-checkout";

function normalizeString(value) {
  return String(value || "").trim();
}

function revalidateMembershipAndFinancePaths(hubSlug) {
  revalidatePath(`/${hubSlug}/account`);
  revalidatePath(`/${hubSlug}/account/membership`);
  revalidatePath(`/${hubSlug}/admin`);
  revalidatePath(`/${hubSlug}/admin/payments`);
}

export async function GET(request, { params }) {
  const { hubSlug } = await params;
  const hub = await requireHubBySlug(hubSlug);
  const memberSession = await requireCurrentMemberSessionForHub(hub, `/${hub.slug}/account/membership`);
  const searchParams = request.nextUrl.searchParams;
  const state = normalizeString(searchParams.get("state"));
  const transactionId = normalizeString(searchParams.get("transaction"));
  const sessionId = normalizeString(searchParams.get("session_id"));
  const routeMode = resolveHubRuntimeRouteMode(getRequestHostFromHeaders(request.headers));
  const membershipHref = buildHubRuntimeHref(hub.slug, "/account/membership", routeMode);
  let redirectPath = membershipHref;

  try {
    if (state === "success") {
      const result = await finalizeMembershipUpgradeCheckoutReturn({
        hub,
        memberSession,
        transactionId,
        sessionId,
        actorId: memberSession.user.id,
      });
      revalidateMembershipAndFinancePaths(hub.slug);

      redirectPath = result.paid
        ? `${membershipHref}?success=checkoutSubmitted`
        : `${membershipHref}?success=checkoutCompleted`;
    } else {
      revalidateMembershipAndFinancePaths(hub.slug);
      redirectPath = `${membershipHref}?success=checkoutCancelled`;
    }
  } catch (error) {
    const message = encodeURIComponent(String(error?.message || "Unable to confirm the Stripe checkout return."));
    redirectPath = `${membershipHref}?error=${message}`;
  }

  redirect(redirectPath);
}
