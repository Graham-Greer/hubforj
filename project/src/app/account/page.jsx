import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Link from "@/components/ui/link/Link";
import Card from "@/components/ui/card/Card";
import Badge from "@/components/ui/badge/Badge";
import { getSession } from "@/lib/auth/session";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { listRegistrationsByUser } from "@/lib/data/events/registration-repository";
import { getLatestMembershipByUser } from "@/lib/data/memberships/membership-repository";
import styles from "@/app/_shared/member-portal/member-portal.module.css";

export const dynamic = "force-dynamic";

function statusTone(status) {
  if (status === "active" || status === "registered") return "brand";
  if (status === "pending" || status === "waitlisted" || status === "inactive") return "neutral";
  if (status === "expired" || status === "cancelled") return "danger";
  return "neutral";
}

export default async function CustomDomainAccountPage() {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const session = await getSession();
  const [membership, registrations] = await Promise.all([
    getLatestMembershipByUser(context.hub.id, session?.uid),
    listRegistrationsByUser(context.hub.id, session?.uid),
  ]);

  return (
    <main className={styles.grid}>
      <header className={styles.header}>
        <Heading as="h1" size="md">Member Account</Heading>
        <Text tone="secondary">Membership and registration details at a glance.</Text>
      </header>
      <Card className={styles.grid}>
        <Heading as="h2" size="sm">Membership</Heading>
        {membership ? (
          <div className={styles.row}>
            <Badge tone={statusTone(membership.status)}>{membership.status}</Badge>
            <Badge tone={membership.paymentStatus === "paid" ? "brand" : "neutral"}>{membership.paymentStatus}</Badge>
          </div>
        ) : <Text tone="secondary">No membership found yet.</Text>}
        <Link href="/account/membership">View membership details</Link>
      </Card>
      <Card className={styles.grid}>
        <Heading as="h2" size="sm">Registrations</Heading>
        <Text tone="secondary">You have {registrations.length} registration(s).</Text>
        {registrations.length ? (
          <div className={styles.row}>
            <Badge tone={statusTone(registrations[0].status)}>
              Latest: {registrations[0].status}
            </Badge>
          </div>
        ) : null}
        <Link href="/account/registrations">View registrations</Link>
      </Card>
    </main>
  );
}
