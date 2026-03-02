import { notFound } from "next/navigation";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import ErrorState from "@/components/ui/error-state/ErrorState";
import HubHeaderFooterFrame from "@/app/_shared/HubHeaderFooterFrame";
import MemberSignInClient from "@/app/_shared/auth/MemberSignInClient";
import { createCustomTokenForSession } from "@/lib/auth/token";
import { getRequestHost, resolveHubByHost } from "@/lib/data/hubs/domain-resolution";
import { getUserByEmail } from "@/lib/data/users/user-repository";
import { validateMemberSignInInput } from "@/lib/validation/onboarding";
import { buildThemeScope } from "@/lib/theming/hub-theme";
import styles from "../custom-domain-shell.module.css";

export const dynamic = "force-dynamic";

async function signInAction(formData) {
  "use server";

  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  try {
    const payload = validateMemberSignInInput({
      email: formData.get("email"),
    });

    const user = await getUserByEmail(payload.email);
    if (!user || user.hubId !== context.hub.id) {
      throw new Error("No account found for this hub. Create an account first.");
    }

    const customToken = await createCustomTokenForSession(user.uid, {
      role: user.role,
      hubId: context.hub.id,
      hubSlug: context.hub.slug,
    });

    return { ok: true, customToken, redirectTo: "/account" };
  } catch (error) {
    return { ok: false, message: error?.message || "Unable to sign in." };
  }
}

export default async function CustomDomainSignInPage({ searchParams }) {
  const host = await getRequestHost();
  const context = await resolveHubByHost(host);
  if (!context.hub) notFound();

  const error = searchParams?.error ? decodeURIComponent(searchParams.error) : "";
  const theme = buildThemeScope(context.hub);

  return (
    <div data-template={theme["data-template"]} data-hub-theme={theme["data-hub-theme"]}>
      {theme.stylesheetHref ? <link rel="stylesheet" href={theme.stylesheetHref} /> : null}
      <HubHeaderFooterFrame hub={context.hub} basePath="">
        <main className={styles.shell}>
          <header>
            <Heading as="h1" size="md">Sign in</Heading>
            <Text tone="secondary">Access your member account for {context.hub.name}.</Text>
          </header>

          {error ? <ErrorState title="Sign-in failed" body={error} variant="compact" /> : null}
          <MemberSignInClient signInAction={signInAction} joinHref="/join" className={styles.form} />
        </main>
      </HubHeaderFooterFrame>
    </div>
  );
}
