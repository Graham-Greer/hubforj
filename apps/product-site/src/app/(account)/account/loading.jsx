import SiteMark from "@/components/patterns/site-mark/SiteMark";

export default function AccountLoading() {
  return (
    <main className="page-shell">
      <header className="marketing-header account-header">
        <section className="page-section page-section--wide">
          <div className="account-topbar">
            <div className="site-mark" aria-hidden="true">
              <SiteMark />
            </div>
            <div className="account-topbar-actions">
              <div className="account-identity">
                <strong>Loading account</strong>
              </div>
            </div>
          </div>
        </section>
      </header>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide content-stack account-page-stack" style={{ paddingBlock: "var(--space-7)" }}>
          <header className="section-heading section-heading--wide">
            <span className="eyebrow">Your account</span>
            <h1 className="headline headline--section">Opening your account.</h1>
            <p className="subcopy">Loading your package, billing, and community workspace.</p>
          </header>
          <div className="content-stack">
            <section className="account-workspace-layout">
              <div className="account-workspace-main">
                <article className="route-card account-focus-panel" aria-busy="true">
                  <div className="account-focus-panel__header">
                    <div>
                      <span className="eyebrow">Workspace</span>
                      <h2>Preparing your workspace</h2>
                    </div>
                  </div>
                  <p className="account-focus-panel__lede">Your account details are being loaded.</p>
                  <div className="status-row account-focus-panel__status">
                    <span className="status-chip">Account</span>
                    <span className="status-chip">Package</span>
                    <span className="status-chip">Billing</span>
                  </div>
                </article>
              </div>
              <aside className="account-workspace-side">
                <article className="route-card account-side-panel" aria-busy="true">
                  <span className="eyebrow">Next step</span>
                  <h2>Almost ready</h2>
                  <p>Your dashboard will appear here shortly.</p>
                </article>
              </aside>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
