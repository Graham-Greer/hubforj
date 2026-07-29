import Link from "next/link";

function normalizeTier(value) {
  return String(value || "").trim().toLowerCase();
}

function getTierRank(tier) {
  return (
    {
      free: 0,
      starter: 1,
      growth: 2,
    }[normalizeTier(tier)] || 0
  );
}

function buildMarketingSignupHref({ tier }) {
  const params = new URLSearchParams();
  params.set("tier", tier);

  return `/signup?${params.toString()}`;
}

export default function PackageCatalog({ items = [], mode = "marketing", currentTier = "" }) {
  const isAccountMode = mode === "account";
  const isSignedInMarketingMode = mode === "signed-in-marketing";

  function resolvePackageAction(item) {
    if (isAccountMode) {
      return {
        href: `/account/upgrade?tier=${encodeURIComponent(item.tier)}`,
        label: `Review ${item.title}`,
      };
    }

    if (isSignedInMarketingMode) {
      return {
        href: "/account/package",
        label: "Manage package",
      };
    }

    return {
      href: buildMarketingSignupHref({ tier: item.tier }),
      label: item.ctaLabel,
    };
  }

  return (
    <div className="package-grid">
      {items.map((item) => {
        const action = resolvePackageAction(item);
        const isCurrent = item.tier === currentTier;
        const isLowerTier = isAccountMode && getTierRank(item.tier) < getTierRank(currentTier);
        const buttonVariant = item.featured && !isLowerTier ? "primary" : "secondary";

        return (
          <article
            key={item.tier}
            className="package-card"
            data-featured={item.featured ? "true" : "false"}
            data-current={isCurrent ? "true" : "false"}
            data-lower-tier={isLowerTier ? "true" : "false"}
          >
            <div className="package-card-body">
              <div className="package-card-header">
                <div className="package-copy">
                  <h2>{item.title}</h2>
                  <p className="package-price">
                    <span className="package-price-value">{item.priceLabel}</span>
                    <span className="package-price-suffix">/month</span>
                  </p>
                  <p>{item.summary}</p>
                </div>
              </div>
              <section className="package-list-block">
                <h3>Included</h3>
                <ul className="detail-list">
                  {item.featureHighlights.map((feature) => (
                    <li key={feature}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        check_circle
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
            <div className="package-action-row">
              {isAccountMode && isCurrent ? (
                <span className="status-chip" data-tone="accent">
                  Current package
                </span>
              ) : (
                <Link href={action.href} className="button-link" data-variant={buttonVariant}>
                  {action.label}
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
