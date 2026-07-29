export default function MarketingHero({
  eyebrow,
  title,
  description,
  actions = null,
  proof = [],
  orbitLabel = "Commercial control plane",
  orbitTitle = "Package authority, acquisition, and billing separated cleanly from operations.",
  orbitCopy = "The product site is where commercial lifecycle lives. The operational platform remains focused on the work communities do every day.",
  floatingCards = [],
}) {
  return (
    <div className="hero-grid">
      <div className="hero-copy">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="headline">{title}</h1>
        <p className="subcopy">{description}</p>
        {actions ? <div className="hero-actions">{actions}</div> : null}
        {proof.length ? (
          <div className="hero-proof">
            {proof.map((item) => (
              <span key={item} className="status-chip" data-tone="accent">
                {item}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="hero-orbit">
        <div className="hero-orbit-card">
          <div className="hero-orbit-grid">
            <span className="hero-orbit-topline">{orbitLabel}</span>
            <h2 className="hero-orbit-title">{orbitTitle}</h2>
            <p className="hero-orbit-copy">{orbitCopy}</p>
          </div>
        </div>
        <div className="hero-orbit-stack">
          {floatingCards.map((item) => (
            <div key={`${item.title}-${item.position}`} className="orbit-floating-card" data-position={item.position}>
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
