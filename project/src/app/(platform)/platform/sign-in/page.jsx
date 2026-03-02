import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import { createCustomTokenForSession } from "@/lib/auth/token";
import PlatformSignInClient from "@/app/_shared/auth/PlatformSignInClient";
import styles from "./page.module.css";

async function signInSuperadmin() {
  "use server";

  try {
    const customToken = await createCustomTokenForSession("local-superadmin", {
      role: "superadmin",
      hubId: null,
      hubSlug: null,
    });
    return { ok: true, customToken, redirectTo: "/platform/hubs" };
  } catch {
    return { ok: false, message: "Unable to initialize superadmin session." };
  }
}

export default function PlatformSignInPage() {
  return (
    <section className={styles.root}>
      <Heading as="h1" size="md">Platform Session</Heading>
      <Text tone="secondary">Use this deterministic local sign-in action to establish a server session cookie.</Text>
      <PlatformSignInClient signInAction={signInSuperadmin} />
    </section>
  );
}
