import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import ErrorState from "@/components/ui/error-state/ErrorState";
import MemberSignInClient from "@/app/_shared/auth/MemberSignInClient";
import { createCustomTokenForSession } from "@/lib/auth/token";
import { getHubBySlug } from "@/lib/data/hubs/hub-repository";
import { getUserByEmail } from "@/lib/data/users/user-repository";
import { validateMemberSignInInput } from "@/lib/validation/onboarding";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

async function signInAction(formData) {
  "use server";

  const hubSlug = String(formData.get("hubSlug") || "").trim();
  const hub = await getHubBySlug(hubSlug);
  if (!hub) {
    return { ok: false, message: "Hub not found." };
  }

  try {
    const payload = validateMemberSignInInput({
      email: formData.get("email"),
    });

    const user = await getUserByEmail(payload.email);
    if (!user || user.hubId !== hub.id) {
      throw new Error("No account found for this hub. Create an account first.");
    }

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
    return { ok: false, message: error?.message || "Unable to sign in." };
  }
}

export default async function PublicSignInPage({ params, searchParams }) {
  const hub = await getHubBySlug(params.hubSlug);
  if (!hub) {
    return <ErrorState title="Hub not found" body="We could not resolve this community hub." />;
  }

  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <Heading as="h1" size="lg">Sign in</Heading>
        <Text tone="secondary">Access your member account for {hub.name}.</Text>
      </header>

      {error ? <ErrorState title="Sign-in failed" body={error} variant="compact" /> : null}
      <MemberSignInClient
        signInAction={signInAction}
        hubSlug={hub.slug}
        joinHref={`/${hub.slug}/join`}
        className={styles.form}
      />
    </main>
  );
}
