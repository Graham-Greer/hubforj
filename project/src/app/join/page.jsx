import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import ErrorState from "@/components/ui/error-state/ErrorState";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import MemberJoinClient from "@/app/_shared/auth/MemberJoinClient";
import { createCustomTokenForSession } from "@/lib/auth/token";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { createMembership } from "@/lib/data/memberships/membership-repository";
import { listMembershipPlansByHub } from "@/lib/data/memberships/membership-plan-repository";
import { createMemberUser, getUserByEmail } from "@/lib/data/users/user-repository";
import { validateJoinInput } from "@/lib/validation/onboarding";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import styles from "../custom-domain-shell.module.css";

export const dynamic = "force-dynamic";

async function joinAction(formData) {
  "use server";

  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  try {
    const payload = validateJoinInput({
      name: formData.get("name"),
      email: formData.get("email"),
      planId: formData.get("planId"),
    });

    const existing = await getUserByEmail(payload.email);
    if (existing) {
      if (existing.hubId !== context.hub.id) {
        throw new Error("This email is already linked to another hub.");
      }
      throw new Error("Account already exists. Please sign in.");
    }

    const user = await createMemberUser({
      hubId: context.hub.id,
      email: payload.email,
      name: payload.name,
    });

    await createMembership(
      context.hub.id,
      {
        userId: user.uid,
        planId: payload.planId,
      },
      { stripeEnabled: Boolean(context.hub.features?.stripePayments) },
      user.uid
    );

    const customToken = await createCustomTokenForSession(user.uid, {
      role: user.role,
      hubId: context.hub.id,
      hubSlug: context.hub.slug,
    });

    return { ok: true, customToken, redirectTo: "/account" };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to create account." };
  }
}

export default async function CustomDomainJoinPage({ searchParams }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const plans = (await listMembershipPlansByHub(context.hub.id)).filter((plan) => plan.active);
  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const theme = buildThemeScope(context.hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} basePath="">
        <main className={styles.shell}>
          <header>
            <Heading as="h1" size="md">Join {context.hub.name}</Heading>
            <Text tone="secondary">Create your account and choose a membership plan.</Text>
          </header>

          {plans.length ? (
            <MemberJoinClient
              joinAction={joinAction}
              plans={plans}
              signInHref="/sign-in"
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
      </HubHeaderFooterFrame>
    </div>
  );
}
