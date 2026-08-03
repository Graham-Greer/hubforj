import { headers } from "next/headers";
import AdminSegmentLoading from "./(admin)/[hubSlug]/loading";
import styles from "./loading.module.css";

export default async function RootLoading() {
  const headerStore = await headers();

  if (headerStore.get("x-hubforj-route-family") === "admin") {
    return <AdminSegmentLoading />;
  }

  return (
    <main className={styles.root}>
      <section className={styles.panel} role="status" aria-live="polite">
        <div className={styles.brand}>
          <span className={styles.mark}>H</span>
          <span>Hubforj</span>
        </div>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>Opening workspace</p>
          <h1 className={styles.title}>Preparing your community portal</h1>
          <p className={styles.description}>We are loading the secure workspace for this hub.</p>
        </div>
        <div className={styles.progress} aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}
