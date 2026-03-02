import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import ErrorState from "@/components/ui/error-state/ErrorState";
import MemberJoinClient from "@/app/_shared/auth/MemberJoinClient";
import { createCustomTokenForSession } from "@/lib/auth/token";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { createMembership } from "@/lib/data/memberships/membership-repository";
import { listMembershipPlansByHub } from "@/lib/data/memberships/membership-plan-repository";
import { createMemberUser, getUserByEmail } from "@/lib/data/users/user-repository";
import { validateJoinInput } from "@/lib/validation/onboarding";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function joinAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    return { ok: false, message: "Hub not found." };
  }

  try {
    const payload = validateJoinInput({
      name: formData.get("name"),
      email: formData.get("email"),
      planId: formData.get("planId"),
    });

    const existing = await getUserByEmail(payload.email);
    if (existing) {
      if (existing.hubId !== hub.id) {
        throw new Error("This email is already linked to another hub.");
      }
      throw new Error("Account already exists. Please sign in.");
    }

    const user = await createMemberUser({
      hubId: hub.id,
      email: payload.email,
      name: payload.name,
    });

    await createMembership(
      hub.id,
      {
        userId: user.uid,
        planId: payload.planId,
      },
      { stripeEnabled: Boolean(hub.features?.stripePayments) },
      user.uid
    );

    const customToken = await createCustomTokenForSession(user.uid, {
      role: user.role,
      hubId: hub.id,
      hubSlug: hub.slug,
    });

    return {
      ok: true,
      customToken,
      redirectTo: `/${hub.slug}/account`,
    };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to create account." };
  }
}

export default async function PublicJoinPage({ params, searchParams }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) {
    return <ErrorState title="Hub not found" body="We could not resolve this community hub." />;
  }

  const plans = (await listMembershipPlansByHub(hub.id)).filter((plan) => plan.active);
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Heading as="h1" size="lg">Join {hub.name}</Heading>
        <Text tone="secondary">Create your account and choose a membership plan.</Text>
      </header>

      {plans.length ? (
        <MemberJoinClient
          joinAction={joinAction}
          hubSlug={hub.slug}
          plans={plans}
          signInHref={`/${hub.slug}/sign-in`}
          className={styles.form}
        />
      ) : (
        <ErrorState
          title="No active plans available"
          body="This hub has no active membership plans yet. Please try again later."
          variant="compact"
        />
      )}
      {error ? <ErrorState title="Could not complete onboarding" body={error} variant="compact" /> : null}
    </main>
  );
}
