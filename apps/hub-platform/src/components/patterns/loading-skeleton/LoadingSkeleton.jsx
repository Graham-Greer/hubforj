import styles from "./LoadingSkeleton.module.css";

function joinClassNames(...values) {
  return values.filter(Boolean).join(" ");
}

function toCount(value, fallback) {
  const count = Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : fallback;
}

export function SkeletonBlock({
  className = "",
  width = "100%",
  height,
  variant = "line",
  compact = false,
}) {
  const style = {
    inlineSize: width,
    ...(height ? { blockSize: height } : {}),
  };

  return (
    <span
      className={joinClassNames(
        styles.block,
        styles[`block-${variant}`],
        compact ? styles.compact : "",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 2, widths = ["100%", "72%"], compact = false }) {
  const lineCount = toCount(lines, 2);

  return (
    <div className={styles.text} aria-hidden="true">
      {Array.from({ length: lineCount }).map((_, index) => (
        <SkeletonBlock
          key={index}
          compact={compact}
          width={widths[index % widths.length]}
        />
      ))}
    </div>
  );
}

export function SkeletonHeading({ eyebrow = true, title = true, description = true }) {
  return (
    <div className={styles.heading} aria-hidden="true">
      {eyebrow ? <SkeletonBlock variant="eyebrow" width="8rem" /> : null}
      {title ? <SkeletonBlock variant="title" width="min(34rem, 92%)" /> : null}
      {description ? <SkeletonText lines={2} widths={["min(42rem, 100%)", "min(32rem, 78%)"]} /> : null}
    </div>
  );
}

export function SkeletonButtonRow({ count = 2 }) {
  const buttonCount = toCount(count, 2);

  return (
    <div className={styles.buttonRow} aria-hidden="true">
      {Array.from({ length: buttonCount }).map((_, index) => (
        <SkeletonBlock key={index} variant="button" width={index === 0 ? "9rem" : "7rem"} />
      ))}
    </div>
  );
}

export function SkeletonMetricGrid({ count = 4, columns = 4 }) {
  const cardCount = toCount(count, 4);

  return (
    <div
      className={styles.metricGrid}
      style={{ "--skeleton-columns": columns }}
      aria-hidden="true"
    >
      {Array.from({ length: cardCount }).map((_, index) => (
        <SkeletonMetricCard key={index} />
      ))}
    </div>
  );
}

export function SkeletonMetricCard() {
  return (
    <article className={styles.metricCard} aria-hidden="true">
      <SkeletonBlock variant="eyebrow" width="42%" />
      <SkeletonBlock variant="metric" width="34%" />
      <SkeletonText lines={2} widths={["92%", "70%"]} compact />
    </article>
  );
}

export function SkeletonPanel({
  title = true,
  rows = 3,
  variant = "default",
  actions = 0,
  children = null,
}) {
  const rowCount = toCount(rows, 3);

  return (
    <section className={joinClassNames(styles.panel, styles[`panel-${variant}`])} aria-hidden="true">
      {title || actions ? (
        <div className={styles.panelHeader}>
          {title ? <SkeletonBlock variant="heading" width="12rem" /> : <span />}
          {actions ? <SkeletonButtonRow count={actions} /> : null}
        </div>
      ) : null}
      {children || (
        <div className={styles.panelRows}>
          {Array.from({ length: rowCount }).map((_, index) => (
            <SkeletonText
              key={index}
              lines={2}
              widths={index % 2 === 0 ? ["86%", "58%"] : ["72%", "44%"]}
              compact
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function SkeletonList({ rows = 6, withBadges = false }) {
  const rowCount = toCount(rows, 6);

  return (
    <div className={styles.list} aria-hidden="true">
      {Array.from({ length: rowCount }).map((_, index) => (
        <article className={styles.listRow} key={index}>
          <div className={styles.listCopy}>
            <SkeletonBlock variant="heading" width={index % 2 === 0 ? "16rem" : "12rem"} />
            <SkeletonText lines={2} widths={["min(30rem, 100%)", "min(20rem, 72%)"]} compact />
          </div>
          {withBadges ? (
            <div className={styles.listBadges}>
              <SkeletonBlock variant="pill" width="5.5rem" />
              <SkeletonBlock variant="pill" width="7rem" />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 4 }) {
  const rowCount = toCount(rows, 6);
  const columnCount = toCount(columns, 4);

  return (
    <div className={styles.table} aria-hidden="true">
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <div
          className={styles.tableRow}
          style={{ "--skeleton-columns": columnCount }}
          key={rowIndex}
        >
          {Array.from({ length: columnCount }).map((_, columnIndex) => (
            <SkeletonBlock
              key={columnIndex}
              width={columnIndex === 0 ? "82%" : columnIndex === columnCount - 1 ? "52%" : "68%"}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonForm({ fields = 4, columns = 2, actions = 1 }) {
  const fieldCount = toCount(fields, 4);

  return (
    <div className={styles.form} aria-hidden="true">
      <div
        className={styles.formGrid}
        style={{ "--skeleton-columns": columns }}
      >
        {Array.from({ length: fieldCount }).map((_, index) => (
          <div className={styles.field} key={index}>
            <SkeletonBlock variant="eyebrow" width={index % 2 === 0 ? "7rem" : "9rem"} />
            <SkeletonBlock variant="input" />
            <SkeletonText lines={2} widths={["92%", "64%"]} compact />
          </div>
        ))}
      </div>
      {actions ? <SkeletonButtonRow count={actions} /> : null}
    </div>
  );
}

export function SkeletonMediaGrid({ count = 6 }) {
  const itemCount = toCount(count, 6);

  return (
    <div className={styles.mediaGrid} aria-hidden="true">
      {Array.from({ length: itemCount }).map((_, index) => (
        <article className={styles.mediaCard} key={index}>
          <SkeletonBlock variant="media" />
          <SkeletonText lines={2} widths={["82%", "54%"]} compact />
        </article>
      ))}
    </div>
  );
}

export function SkeletonRouteSection({
  eyebrow = true,
  title = true,
  description = true,
  actions = 0,
  status = "Loading content",
  children,
}) {
  return (
    <section className={styles.routeSection} aria-busy="true" aria-label={status}>
      <div className={styles.routeHeader}>
        <SkeletonHeading eyebrow={eyebrow} title={title} description={description} />
        {actions ? <SkeletonButtonRow count={actions} /> : null}
      </div>
      {children ? <div className={styles.routeBody}>{children}</div> : null}
      <span className={styles.statusText}>{status}</span>
    </section>
  );
}
