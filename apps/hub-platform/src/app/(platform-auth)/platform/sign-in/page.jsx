import { redirect } from "next/navigation";
import Button from "@/components/ui/button/Button";
import Surface from "@/components/primitives/surface/Surface";
import { getCurrentSuperadminSession } from "@/lib/auth/platform-session";
import PlatformSignInForm from "./PlatformSignInForm";
import styles from "./page.module.css";

export default async function PlatformSignInPage({ searchParams }) {
  const nextPath = String((await searchParams)?.next || "/platform").trim() || "/platform";
  const session = await getCurrentSuperadminSession();

  if (session) {
    redirect(nextPath.startsWith("/") ? nextPath : "/platform");
  }

  return (
    <div className={styles.root}>
      <Surface className={styles.card}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Platform sign in</p>
          <h1 className={styles.title}>Sign in to Hub Platform</h1>
          <p className={styles.description}>
            Operator authentication should be explicit and separate from member access. This route establishes a
            superadmin session for provisioning, support, and cross-hub operations.
          </p>
        </div>

        <PlatformSignInForm nextPath={nextPath} />

        <div className={styles.supporting}>
          <div className={styles.supportCard}>
            <h2 className={styles.supportTitle}>Operator-only access</h2>
            <p className={styles.supportBody}>Only active superadmin accounts can enter the platform workspace.</p>
          </div>
          <div className={styles.supportCard}>
            <h2 className={styles.supportTitle}>Direct return path</h2>
            <p className={styles.supportBody}>After sign-in, operators return to the platform route they were trying to open.</p>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerCopy}>Trying to access a specific hub instead?</p>
          <Button href="/" variant="ghost">
            Go to app root
          </Button>
        </div>
      </Surface>
    </div>
  );
}
