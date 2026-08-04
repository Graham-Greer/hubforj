import { headers } from "next/headers";
import AdminSegmentLoading from "./(admin)/[hubSlug]/loading";
import styles from "./loading.module.css";

function PublicRouteLoading() {
  return (
    <main className={styles.publicRoot} aria-busy="true" aria-label="Loading public site">
      <header className={styles.publicHeader}>
        <div className={styles.publicHeaderInner}>
          <div className={styles.publicBrand}>
            <span className={styles.publicMark} />
            <span className={styles.publicBrandText} />
          </div>
          <nav className={styles.publicNav} aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className={styles.publicNavItem} />
            ))}
          </nav>
          <span className={styles.publicAction} />
        </div>
      </header>
      <section className={styles.publicHero}>
        <div className={styles.publicHeroInner}>
          <div className={styles.publicHeroCopy}>
            <span className={styles.publicEyebrow} />
            <span className={styles.publicTitle} />
            <span className={styles.publicTitleShort} />
            <span className={styles.publicDescription} />
            <span className={styles.publicDescriptionShort} />
          </div>
        </div>
      </section>
      <section className={styles.publicContent}>
        <div className={styles.publicContentInner}>
          <div className={styles.publicToolbar}>
            <span className={styles.publicSearch} />
            <span className={styles.publicFilter} />
            <span className={styles.publicFilterShort} />
          </div>
          <div className={styles.publicGrid}>
            {Array.from({ length: 3 }).map((_, index) => (
              <article key={index} className={styles.publicCard}>
                <span className={styles.publicMedia} />
                <span className={styles.publicCardTitle} />
                <span className={styles.publicCardLine} />
                <span className={styles.publicCardLineShort} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function RootLoading() {
  const headerStore = await headers();

  if (headerStore.get("x-hubforj-route-family") === "admin") {
    return <AdminSegmentLoading />;
  }

  return <PublicRouteLoading />;
}
