import styles from "./MemberAccountFallbacks.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function Block({ className = "", width = "100%", height, variant = "line" }) {
  return (
    <span
      aria-hidden="true"
      className={joinClassNames(styles.block, styles[`block-${variant}`], className)}
      style={{
        inlineSize: width,
        ...(height ? { blockSize: height } : {}),
      }}
    />
  );
}

function TextLines({ widths = ["100%", "72%"], compact = false }) {
  return (
    <div className={joinClassNames(styles.text, compact ? styles.textCompact : "")} aria-hidden="true">
      {widths.map((width, index) => (
        <Block key={`${width}-${index}`} width={width} />
      ))}
    </div>
  );
}

function PillRow({ count = 2 }) {
  return (
    <div className={styles.pillRow} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Block key={index} variant="pill" width={index % 2 === 0 ? "5.5rem" : "6.75rem"} />
      ))}
    </div>
  );
}

function ButtonRow({ count = 1 }) {
  return (
    <div className={styles.buttonRow} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <Block key={index} variant="button" width={index === 0 ? "8.5rem" : "7rem"} />
      ))}
    </div>
  );
}

function MetricCards({ count = 3 }) {
  return (
    <div className={styles.metricGrid} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <article className={styles.metricCard} key={index}>
          <Block variant="eyebrow" width={index === 0 ? "6rem" : "8rem"} />
          <Block variant="metric" width={index === 0 ? "8rem" : "3rem"} />
          <TextLines widths={["92%", "70%"]} compact />
        </article>
      ))}
    </div>
  );
}

function PanelHeader({ action = false, eyebrow = false }) {
  return (
    <div className={styles.panelHeader} aria-hidden="true">
      <div className={styles.panelCopy}>
        {eyebrow ? <Block variant="eyebrow" width="5.5rem" /> : null}
        <Block variant="heading" width="12rem" />
        <TextLines widths={["min(100%, 26rem)"]} compact />
      </div>
      {action ? <ButtonRow count={1} /> : null}
    </div>
  );
}

function BookingCard({ compact = false }) {
  const metaWidths = compact
    ? ["min(100%, 19rem)", "min(100%, 15rem)"]
    : ["min(100%, 19rem)", "min(100%, 15rem)", "min(100%, 10rem)"];

  return (
    <article className={styles.itemCard} aria-hidden="true">
      <div className={styles.itemHeader}>
        <div className={styles.mediaLead}>
          <Block className={styles.thumbnail} variant="media" width={compact ? "4.75rem" : "5.5rem"} />
          <div className={styles.itemCopy}>
            <Block variant="heading" width={compact ? "13rem" : "18rem"} />
            <TextLines widths={metaWidths} compact />
          </div>
        </div>
        <PillRow count={compact ? 2 : 3} />
      </div>
      <ButtonRow count={compact ? 1 : 2} />
    </article>
  );
}

function BillingCard() {
  return (
    <article className={styles.itemCard} aria-hidden="true">
      <div className={styles.itemHeader}>
        <div className={styles.itemCopy}>
          <Block variant="heading" width="16rem" />
          <TextLines widths={["min(100%, 16rem)", "min(100%, 8rem)"]} compact />
        </div>
        <PillRow count={2} />
      </div>
      <ButtonRow count={1} />
    </article>
  );
}

function ToolbarSkeleton({ withToggle = false }) {
  return (
    <div className={styles.toolbar} aria-hidden="true">
      {withToggle ? <Block className={styles.toggle} variant="input" width="18rem" /> : null}
      <div className={styles.searchControls}>
        <Block className={styles.searchInput} variant="input" width="100%" />
        <Block className={styles.filterButton} variant="button" width="3rem" />
      </div>
    </div>
  );
}

export function MemberOverviewFallback() {
  return (
    <div className={styles.root} role="status" aria-label="Loading account overview">
      <MetricCards count={3} />
      <section className={styles.panel} aria-hidden="true">
        <div className={styles.panelHeader}>
          <div className={styles.panelCopy}>
            <Block variant="eyebrow" width="6.5rem" />
            <Block variant="heading" width="16rem" />
            <TextLines widths={["min(100%, 18rem)"]} compact />
          </div>
          <PillRow count={2} />
        </div>
        <ButtonRow count={1} />
      </section>
      <div className={styles.previewGrid}>
        <section className={styles.panel} aria-hidden="true">
          <PanelHeader action eyebrow />
          <div className={styles.list}>
            <BookingCard compact />
          </div>
        </section>
        <section className={styles.panel} aria-hidden="true">
          <PanelHeader action eyebrow />
          <div className={styles.list}>
            <BillingCard />
          </div>
        </section>
      </div>
    </div>
  );
}

export function MemberBookingsFallback() {
  return (
    <div className={styles.root} role="status" aria-label="Loading bookings">
      <ToolbarSkeleton withToggle />
      <Block variant="line" width="10rem" />
      <div className={styles.list}>
        <BookingCard />
        <BookingCard />
      </div>
    </div>
  );
}

export function MemberMembershipFallback() {
  return (
    <div className={styles.root} role="status" aria-label="Loading membership">
      <section className={styles.panel} aria-hidden="true">
        <PanelHeader action />
        <PillRow count={3} />
        <div className={styles.factGrid}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div className={styles.factCard} key={index}>
              <Block variant="eyebrow" width={index === 1 ? "6.5rem" : "5rem"} />
              <Block variant="heading" width={index === 2 ? "5rem" : "8rem"} />
            </div>
          ))}
        </div>
      </section>
      <section className={styles.panel} aria-hidden="true">
        <PanelHeader />
        <article className={styles.itemCard}>
          <div className={styles.itemHeader}>
            <div className={styles.itemCopy}>
              <Block variant="heading" width="14rem" />
              <TextLines widths={["min(100%, 18rem)", "min(100%, 28rem)"]} compact />
            </div>
            <PillRow count={2} />
          </div>
          <ButtonRow count={1} />
        </article>
      </section>
    </div>
  );
}

export function MemberBillingFallback() {
  return (
    <div className={styles.root} role="status" aria-label="Loading billing">
      <MetricCards count={3} />
      <ToolbarSkeleton />
      <Block variant="line" width="10rem" />
      <div className={styles.list}>
        <BillingCard />
        <BillingCard />
      </div>
    </div>
  );
}

export function MemberProfileFallback() {
  return (
    <div className={styles.root} role="status" aria-label="Loading profile">
      <section className={styles.panel} aria-hidden="true">
        <div className={styles.identityHeader}>
          <div className={styles.mediaLead}>
            <Block className={styles.avatar} variant="media" width="4rem" />
            <div className={styles.itemCopy}>
              <Block variant="heading" width="16rem" />
            </div>
          </div>
          <ButtonRow count={1} />
        </div>
        <PillRow count={2} />
        <div className={styles.details}>
          <div className={styles.detailRow}>
            <Block variant="eyebrow" width="6rem" />
            <Block variant="line" width="16rem" />
          </div>
          <div className={styles.detailRow}>
            <Block variant="eyebrow" width="4rem" />
            <Block variant="line" width="18rem" />
          </div>
        </div>
      </section>
    </div>
  );
}
