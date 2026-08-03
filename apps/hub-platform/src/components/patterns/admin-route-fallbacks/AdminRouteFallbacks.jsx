import {
  SkeletonBlock,
  SkeletonButtonRow,
  SkeletonMediaGrid,
  SkeletonMetricGrid,
  SkeletonPanel,
  SkeletonText,
  SkeletonTable,
} from "@/components/patterns/loading-skeleton";
import styles from "./AdminRouteFallbacks.module.css";

function toCount(value, fallback) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : fallback;
}

export function AdminRouteStack({ children }) {
  return <div className={styles.stack}>{children}</div>;
}

export function AdminProgrammeListFallback({ rows = 3, filters = 3 }) {
  const rowCount = toCount(rows, 3);
  const filterCount = toCount(filters, 3);

  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading programme records">
      <div className={styles.toolbar}>
        <SkeletonBlock variant="input" width="min(22rem, 100%)" />
        <div className={styles.filterRow}>
          {Array.from({ length: filterCount }).map((_, index) => (
            <SkeletonBlock key={index} variant="pill" width={index === 0 ? "4rem" : "4.5rem"} />
          ))}
        </div>
      </div>

      <div className={styles.paginationRow}>
        <SkeletonBlock width="10rem" />
        <div className={styles.paginationControls}>
          <SkeletonBlock variant="pill" width="7rem" />
          <SkeletonBlock width="5rem" />
          <SkeletonBlock variant="button" width="5rem" />
          <SkeletonBlock variant="button" width="4rem" />
        </div>
      </div>

      <div className={styles.list}>
        {Array.from({ length: rowCount }).map((_, index) => (
          <article className={styles.programmeCard} key={index} aria-hidden="true">
            <div className={styles.cardHeader}>
              <SkeletonBlock variant="heading" width={index % 2 === 0 ? "18rem" : "14rem"} />
              <div className={styles.badges}>
                <SkeletonBlock variant="pill" width="5.5rem" />
                <SkeletonBlock variant="pill" width="6rem" />
                <SkeletonBlock variant="pill" width="2.5rem" />
              </div>
            </div>
            <div className={styles.programmeBody}>
              <SkeletonBlock className={styles.programmeMedia} variant="media" width="12rem" />
              <div className={styles.programmeCopy}>
                <SkeletonBlock width="min(26rem, 80%)" />
                <SkeletonText lines={2} widths={["min(48rem, 100%)", "min(34rem, 74%)"]} />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminStatsListFallback({ rows = 4, withAvatar = false }) {
  const rowCount = toCount(rows, 4);

  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading content records">
      <SkeletonMetricGrid count={3} columns={3} />
      <div className={styles.list}>
        {Array.from({ length: rowCount }).map((_, index) => (
          <article className={styles.contentCard} key={index} aria-hidden="true">
            <div className={styles.cardHeader}>
              <div className={styles.identity}>
                {withAvatar ? <SkeletonBlock className={styles.avatar} variant="media" width="3.5rem" /> : null}
                <div className={styles.identityCopy}>
                  <SkeletonBlock variant="heading" width={index % 2 === 0 ? "16rem" : "12rem"} />
                  <SkeletonBlock width="8rem" compact />
                </div>
              </div>
              <div className={styles.badges}>
                <SkeletonBlock variant="pill" width="5.5rem" />
                {withAvatar ? <SkeletonBlock variant="pill" width="5rem" /> : null}
                <SkeletonBlock variant="pill" width="2.5rem" />
              </div>
            </div>
            <SkeletonText
              lines={withAvatar ? 2 : 1}
              widths={withAvatar ? ["min(56rem, 100%)", "min(42rem, 78%)"] : ["min(64rem, 100%)"]}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminMediaLibraryFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading media library">
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.mediaWorkspace}>
          <SkeletonBlock variant="input" width="100%" />
          <div className={styles.tabs}>
            <SkeletonBlock variant="pill" width="3rem" />
            <SkeletonBlock variant="pill" width="4.5rem" />
            <SkeletonBlock variant="pill" width="4.5rem" />
            <SkeletonBlock variant="pill" width="3.5rem" />
          </div>
          <div className={styles.folderGrid}>
            {Array.from({ length: 5 }).map((_, index) => (
              <article className={styles.folderCard} key={index} aria-hidden="true">
                <SkeletonBlock variant="heading" width={index === 0 ? "7rem" : "9rem"} />
                <SkeletonBlock width="5rem" compact />
              </article>
            ))}
          </div>
          <div className={styles.mediaContent}>
            <SkeletonMediaGrid count={8} />
            <SkeletonPanel title rows={4} variant="list">
              <div className={styles.detailsPreview}>
                <SkeletonBlock variant="media" />
              </div>
              <SkeletonText lines={4} widths={["80%", "64%", "92%", "56%"]} />
            </SkeletonPanel>
          </div>
        </div>
      </SkeletonPanel>
    </section>
  );
}

export function AdminPaymentSetupFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading payment setup">
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.paymentSetupHero} aria-hidden="true">
          <div className={styles.badges}>
            <SkeletonBlock variant="pill" width="4rem" />
            <SkeletonBlock variant="pill" width="10rem" />
          </div>
          <SkeletonBlock variant="heading" width="18rem" />
          <SkeletonText lines={2} widths={["min(44rem, 100%)", "min(28rem, 72%)"]} />
          <div className={styles.paymentFactsGrid}>
            {Array.from({ length: 6 }).map((_, index) => (
              <article className={styles.paymentFact} key={index}>
                <SkeletonBlock variant="eyebrow" width={index % 2 === 0 ? "7rem" : "9rem"} />
                <SkeletonBlock variant="heading" width={index % 2 === 0 ? "13rem" : "9rem"} />
              </article>
            ))}
          </div>
        </div>
      </SkeletonPanel>
    </section>
  );
}

export function AdminPaymentRecordsFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading payment records">
      <SkeletonMetricGrid count={4} columns={4} />
      <div className={styles.paymentToolbar} aria-hidden="true">
        <div className={styles.paymentDateFilters}>
          <SkeletonBlock variant="heading" width="3rem" />
          <SkeletonBlock variant="input" width="9rem" />
          <SkeletonBlock variant="heading" width="2rem" />
          <SkeletonBlock variant="input" width="9rem" />
        </div>
        <SkeletonBlock variant="input" width="min(100%, 34rem)" />
        <SkeletonButtonRow count={3} />
      </div>
      <div className={styles.paginationRow} aria-hidden="true">
        <SkeletonBlock width="14rem" />
        <div className={styles.paginationControls}>
          <SkeletonBlock variant="pill" width="7rem" />
          <SkeletonBlock width="5rem" />
          <SkeletonBlock variant="button" width="5rem" />
          <SkeletonBlock variant="button" width="4rem" />
        </div>
      </div>
      <SkeletonTable rows={6} columns={6} />
    </section>
  );
}

export function AdminMembershipPlansFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading membership plans">
      <div className={styles.planAction} aria-hidden="true">
        <SkeletonBlock variant="button" width="12rem" />
      </div>
      <div className={styles.list}>
        {Array.from({ length: 2 }).map((_, index) => (
          <article className={styles.planRow} key={index} aria-hidden="true">
            <div className={styles.planIdentity}>
              <SkeletonBlock variant="heading" width={index === 0 ? "14rem" : "12rem"} />
              <SkeletonBlock variant="pill" width={index === 0 ? "7rem" : "6.5rem"} />
              <SkeletonBlock variant="pill" width={index === 0 ? "8rem" : "4.5rem"} />
              <SkeletonBlock variant="pill" width="4.5rem" />
            </div>
            <SkeletonButtonRow count={2} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminSettingsOverviewFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading site settings">
      <SkeletonMetricGrid count={3} columns={3} />
      <div className={styles.settingsCardGrid}>
        {Array.from({ length: 3 }).map((_, index) => (
          <article className={styles.settingsCard} key={index} aria-hidden="true">
            <div className={styles.cardHeader}>
              <SkeletonBlock variant="heading" width={index === 0 ? "8rem" : "10rem"} />
              <SkeletonBlock variant="pill" width={index === 2 ? "6rem" : "8rem"} />
            </div>
            <SkeletonText lines={2} widths={["min(34rem, 100%)", "min(24rem, 72%)"]} />
            <SkeletonBlock width={index === 0 ? "12rem" : "14rem"} />
            <SkeletonBlock variant="button" width={index === 2 ? "9rem" : "10rem"} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminPageSettingsFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading page settings">
      <div className={styles.settingsCardGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <article className={styles.settingsCard} key={index} aria-hidden="true">
            <div className={styles.cardHeader}>
              <SkeletonBlock variant="heading" width={index === 0 ? "9rem" : "7rem"} />
              <SkeletonBlock variant="pill" width="5.5rem" />
            </div>
            <SkeletonText lines={2} widths={["min(34rem, 100%)", "min(22rem, 68%)"]} />
            <SkeletonBlock width={index === 0 ? "22rem" : "14rem"} />
            <SkeletonBlock variant="button" width="7rem" />
          </article>
        ))}
      </div>
    </section>
  );
}

export function AdminLegalSettingsBodyFallback() {
  return (
    <div className={styles.legalBody} aria-busy="true" aria-label="Loading legal editor">
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.badges}>
          <SkeletonBlock variant="pill" width="6rem" />
          <SkeletonBlock variant="pill" width="7rem" />
        </div>
      </SkeletonPanel>
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.tabs}>
          <SkeletonBlock variant="button" width="10rem" />
          <SkeletonBlock variant="button" width="8rem" />
        </div>
      </SkeletonPanel>
      <div className={styles.legalContentGrid}>
        <section className={styles.legalEditor} aria-hidden="true">
          <SkeletonBlock variant="heading" width="12rem" />
          <SkeletonText lines={2} widths={["min(34rem, 100%)", "min(20rem, 64%)"]} />
          <div className={styles.badges}>
            <SkeletonBlock variant="pill" width="8rem" />
            <SkeletonBlock variant="pill" width="9rem" />
          </div>
          <SkeletonBlock variant="eyebrow" width="10rem" />
          <SkeletonButtonRow count={6} />
          <SkeletonBlock variant="input" height="12rem" />
        </section>
        <section className={styles.legalGuidance} aria-hidden="true">
          <SkeletonBlock variant="heading" width="8rem" />
          <SkeletonPanel title rows={3} />
          <SkeletonPanel title rows={3} />
          <SkeletonPanel title rows={2} />
        </section>
      </div>
    </div>
  );
}

export function AdminLegalSettingsFallback() {
  return (
    <section className={styles.legalShell} aria-busy="true" aria-label="Loading legal settings">
      <div className={styles.legalHeader}>
        <div className={styles.legalHeaderCopy}>
          <SkeletonBlock variant="eyebrow" width="6rem" />
          <SkeletonBlock variant="title" width="min(24rem, 90%)" />
          <SkeletonText lines={2} widths={["min(44rem, 100%)", "min(34rem, 76%)"]} />
        </div>
        <SkeletonBlock variant="button" width="8rem" />
      </div>
      <AdminLegalSettingsBodyFallback />
    </section>
  );
}

export function AdminAccountSettingsFallback() {
  return (
    <section className={styles.stack} aria-busy="true" aria-label="Loading account settings">
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.accountPackage} aria-hidden="true">
          <div className={styles.cardHeader}>
            <div className={styles.accountCopy}>
              <div className={styles.badges}>
                <SkeletonBlock variant="pill" width="5rem" />
                <SkeletonBlock variant="pill" width="5rem" />
              </div>
              <SkeletonBlock variant="heading" width="12rem" />
              <SkeletonText lines={2} widths={["min(34rem, 100%)", "min(24rem, 72%)"]} />
              <SkeletonBlock variant="pill" width="8rem" />
            </div>
            <SkeletonBlock variant="button" width="13rem" />
          </div>
          <SkeletonBlock width="min(52rem, 100%)" />
        </div>
      </SkeletonPanel>
      <SkeletonMetricGrid count={3} columns={3} />
      <SkeletonPanel title={false} rows={0}>
        <div className={styles.accountDomain} aria-hidden="true">
          <div className={styles.accountCopy}>
            <SkeletonBlock variant="heading" width="12rem" />
            <SkeletonBlock width="min(32rem, 100%)" />
          </div>
          <div className={styles.accountDomainGrid}>
            <section className={styles.accountDomainPanel}>
              <SkeletonBlock variant="heading" width="5rem" />
              <SkeletonBlock variant="pill" width="7rem" />
              <SkeletonText lines={2} widths={["90%", "68%"]} />
              <SkeletonBlock width="min(20rem, 100%)" />
              <SkeletonBlock width="min(18rem, 80%)" />
            </section>
            <section className={styles.accountDomainPanel}>
              <SkeletonBlock variant="heading" width="14rem" />
              <SkeletonText lines={2} widths={["90%", "72%"]} />
              <SkeletonBlock variant="input" />
              <SkeletonBlock width="min(22rem, 82%)" />
              <SkeletonButtonRow count={1} />
            </section>
          </div>
        </div>
      </SkeletonPanel>
    </section>
  );
}
