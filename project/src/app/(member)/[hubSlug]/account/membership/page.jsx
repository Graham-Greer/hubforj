import { redirect } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Card from "@/components/ui/card/Card";
import Badge from "@/components/ui/badge/Badge";
import ErrorState from "@/components/ui/error-state/ErrorState";
import EmptyState from "@/components/ui/empty-state/EmptyState";
import { getSession } from "@/lib/auth/session";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import {
  getLatestMembershipByUser,
  getMembershipById,
  transitionMembershipStatus,
} from "@/lib/data/memberships/membership-repository";
import CancelMembershipButton from "@/app/_shared/member-portal/CancelMembershipButton";
import styles from "@/app/_shared/member-portal/member-portal.module.css";

export const dynamic = "force-dynamic";

function statusTone(status) {
  if (status === "active") return "brand";
  if (status === "pending" || status === "inactive") return "neutral";
  if (status === "expired" || status === "cancelled") return "danger";
  return "neutral";
}

async function cancelMembershipAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const membershipId = String(formData.get("membershipId") || "").trim();
  const session = await getSession();
  if (!session?.uid) {
    redirect(`/${hubSlug}/sign-in`);
  }

  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    redirect(`/${hubSlug}/account/membership?error=${encodeURIComponent("Hub not found.")}`);
  }

  try {
    const membership = await getMembershipById(hub.id, membershipId);
    if (!membership) {
      throw new Error("Membership not found.");
    }
    if (membership.userId !== session.uid) {
      throw new Error("You can only cancel your own membership.");
    }

    await transitionMembershipStatus(hub.id, membershipId, "cancelled", session.uid);
    redirect(`/${hub.slug}/account/membership?success=cancelled`);
  } catch (error) {
    redirect(`/${hub.slug}/account/membership?error=${encodeURIComponent(error?.message || "Unable to cancel membership.")}`);
  }
}

export default async function MemberMembershipPage({ params, searchParams }) {
  const session = await getSession();
  const hub = await getHubBySlug(params.hubSlug);
  const membership = hub ? await getLatestMembershipByUser(hub.id, session?.uid) : null;
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const success = searchParams?.success ? decodeURIComponent(searchParams.success) : "";

  return (
    <main className={styles.grid}>
      <header className={styles.header}>
        <Heading as="h1" size="md">Membership</Heading>
        <Text tone="secondary">Track your membership lifecycle and account standing.</Text>
      </header>

      {error ? <ErrorState title="Membership update failed" body={error} variant="compact" /> : null}
      {success === "cancelled" ? <Text>Your membership has been cancelled.</Text> : null}

      {membership ? (
        <Card className={styles.grid}>
          <div className={styles.row}>
            <Text tone="secondary">Status</Text>
            <Badge tone={statusTone(membership.status)}>{membership.status}</Badge>
          </div>
          <div className={styles.row}>
            <Text tone="secondary">Payment</Text>
            <Badge tone={membership.paymentStatus === "paid" ? "brand" : "neutral"}>
              {membership.paymentStatus}
            </Badge>
          </div>
          <Text tone="secondary">Renewal date: {membership.renewalDate || "TBD"}</Text>

          {membership.status !== "cancelled" ? (
            <CancelMembershipButton
              action={cancelMembershipAction}
              hiddenFields={{ hubSlug: hub.slug, membershipId: membership.id }}
            />
          ) : null}
        </Card>
      ) : (
        <EmptyState title="No membership found" body="You do not have a membership record yet." />
      )}
    </main>
  );
}
