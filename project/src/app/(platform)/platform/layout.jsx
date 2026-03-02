import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Link from "@/components/ui/link/Link";
import { getRequestHost, isCustomDomainRequest } from "@/lib/data/hubs/domain-resolution";
import styles from "./layout.module.css";

export default async function PlatformLayout({ children }) {
  const host = await getRequestHost();
  if (await isCustomDomainRequest(host)) {
    return (
      <main className={styles.main}>
        <Heading as="h1" size="md">Platform routes unavailable on custom domains</Heading>
        <Text tone="secondary">Open the platform domain to access `/platform/*` screens.</Text>
      </main>
    );
  }

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>Platform</div>
        <nav className={styles.nav} aria-label="Platform nav">
          <Link href="/platform/hubs" underline={false}>Hubs</Link>
          <Link href="/platform/sign-in" underline={false}>Session</Link>
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
