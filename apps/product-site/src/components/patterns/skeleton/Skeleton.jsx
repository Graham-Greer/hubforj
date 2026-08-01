function joinClasses(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SkeletonBlock({ className = "", style = {}, ...props }) {
  return <span className={joinClasses("skeleton-block", className)} style={style} aria-hidden="true" {...props} />;
}

export function SkeletonText({ lines = 1, className = "" }) {
  return (
    <span className={joinClasses("skeleton-text", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-text-line" data-line={index + 1} />
      ))}
    </span>
  );
}

export function SkeletonButtonRow({ count = 1, className = "" }) {
  return (
    <span className={joinClasses("skeleton-action-row", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-button" />
      ))}
    </span>
  );
}

export function SkeletonStatusRow({ count = 2, className = "" }) {
  return (
    <span className={joinClasses("skeleton-status-row", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className="skeleton-chip" />
      ))}
    </span>
  );
}

export function SkeletonMetricStrip({ count = 3, className = "" }) {
  return (
    <span className={joinClasses("account-metric-strip skeleton-metric-strip", className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <span key={index} className="account-metric-item skeleton-metric-item">
          <SkeletonBlock className="skeleton-label" />
          <SkeletonBlock className="skeleton-strong-line" />
          <SkeletonText lines={2} />
        </span>
      ))}
    </span>
  );
}

export function SkeletonSideList({ rows = 3, className = "" }) {
  return (
    <span className={joinClasses("account-side-list skeleton-side-list", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <span key={index}>
          <SkeletonBlock className="skeleton-label" />
          <SkeletonBlock className="skeleton-strong-line" />
        </span>
      ))}
    </span>
  );
}

export function SkeletonCard({ className = "", lines = 2, chips = 0, actions = 0, children = null }) {
  return (
    <article className={joinClasses("route-card skeleton-card", className)} aria-busy="true">
      <SkeletonBlock className="skeleton-label" />
      <SkeletonBlock className="skeleton-title-line" />
      <SkeletonText lines={lines} />
      {chips ? <SkeletonStatusRow count={chips} /> : null}
      {children}
      {actions ? <SkeletonButtonRow count={actions} /> : null}
    </article>
  );
}

export function SkeletonPackageGrid({ count = 3 }) {
  return (
    <div className="package-grid skeleton-package-grid" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <article key={index} className="package-card skeleton-package-card">
          <div className="package-card-body">
            <div className="package-card-header">
              <div className="package-copy">
                <SkeletonBlock className="skeleton-title-line" />
                <SkeletonBlock className="skeleton-price-line" />
                <SkeletonText lines={2} />
              </div>
            </div>
            <section className="package-list-block">
              <SkeletonBlock className="skeleton-label" />
              <SkeletonText lines={6} />
            </section>
          </div>
          <div className="package-action-row">
            <SkeletonBlock className="skeleton-button" />
          </div>
        </article>
      ))}
    </div>
  );
}
