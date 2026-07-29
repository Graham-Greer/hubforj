function renderNodeList(items = [], renderItem) {
  return items.filter(Boolean).map(renderItem);
}

export function AccountStatusBanner({
  title,
  description,
  chips = [],
  actions = null,
  children = null,
  tone = "default",
}) {
  return (
    <article className="route-card account-status-banner" data-tone={tone}>
      <div className="account-status-banner__body">
        <div className="account-status-banner__copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {chips.length ? (
          <div className="status-row">
            {renderNodeList(chips, (chip, index) => (
              <span key={index}>{chip}</span>
            ))}
          </div>
        ) : null}
      </div>
      {children}
      {actions ? <div className="button-row">{actions}</div> : null}
    </article>
  );
}

export function AccountStatsRow({ items = [] }) {
  return (
    <div className="stats-grid account-stats-row">
      {items.map((item) => (
        <article key={item.label} className="stat-card">
          <span className="stat-label">{item.label}</span>
          <strong className="stat-value">{item.value}</strong>
          {item.copy ? <p>{item.copy}</p> : null}
        </article>
      ))}
    </div>
  );
}

export function AccountActionGrid({ children }) {
  return <div className="detail-grid account-action-grid">{children}</div>;
}

export function AccountActionPanel({ title, description, chips = [], actions = null, children = null }) {
  return (
    <article className="route-card account-action-panel">
      <div className="account-action-panel__body">
        <div className="account-action-panel__copy">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {chips.length ? (
          <div className="status-row">
            {renderNodeList(chips, (chip, index) => (
              <span key={index}>{chip}</span>
            ))}
          </div>
        ) : null}
        {children}
      </div>
      {actions ? <div className="button-row">{actions}</div> : null}
    </article>
  );
}

export function AccountInfoGrid({ title, description = "", sections = [] }) {
  return (
    <article className="route-card account-info-panel">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      <div className="detail-grid">
        {sections.map((section) => (
          <div key={section.title} className="detail-block">
            <h3>{section.title}</h3>
            {Array.isArray(section.items) && section.items.length ? (
              <ul className="detail-list">
                {section.items.map((item) => (
                  <li key={item}>
                    <span className="material-symbols-outlined" aria-hidden="true">
                      check_circle
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : section.copy ? (
              <p>{section.copy}</p>
            ) : null}
          </div>
        ))}
      </div>
    </article>
  );
}
