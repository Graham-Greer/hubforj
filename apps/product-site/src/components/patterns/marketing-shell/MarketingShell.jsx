import MarketingNav from "@/components/patterns/marketing-nav/MarketingNav";
import Link from "next/link";
import { readCommercialAccountSession } from "@/lib/server/account-session";

export default async function MarketingShell({ children }) {
  const session = await readCommercialAccountSession();
  const hasAccountSession = Boolean(session);

  return (
    <main className="page-shell">
      <header className="marketing-header">
        <section className="page-section page-section--wide">
          <MarketingNav hasAccountSession={hasAccountSession} />
        </section>
      </header>
      <div className="marketing-main">{children}</div>
      <footer className="marketing-footer">
        <section className="page-section page-section--wide marketing-footer-grid">
          <div className="marketing-footer-brand footer-heading">
            <span className="eyebrow">Hubforj</span>
            <h2 className="footer-title">Run your community on one platform instead of juggling disconnected tools.</h2>
            <p className="footer-copy">
              Hubforj brings your website, members, events, courses, and admin tools into one clearer system.
            </p>
          </div>
          <div className="marketing-footer-column">
            <h3>Platform</h3>
            <Link href="/pricing">Pricing</Link>
            {hasAccountSession ? (
              <>
                <Link href="/account">Account overview</Link>
                <Link href="/account/package">Manage package</Link>
              </>
            ) : (
              <>
                <Link href="/">Overview</Link>
                <Link href="/signup">Start your community</Link>
              </>
            )}
          </div>
          <div className="marketing-footer-column">
            <h3>{hasAccountSession ? "Your account" : "Get started"}</h3>
            {hasAccountSession ? (
              <>
                <Link href="/account">Account overview</Link>
                <Link href="/account/package">Package management</Link>
                <Link href="/account/billing">Billing</Link>
              </>
            ) : (
              <>
                <Link href="/pricing">View pricing</Link>
                <Link href="/signup">Create your community</Link>
                <Link href="/sign-in">Sign in</Link>
              </>
            )}
          </div>
          <div className="marketing-footer-column">
            <h3>Why it works</h3>
            <p>Your website and admin tools stay connected.</p>
            <p>Your package and billing stay easy to manage.</p>
            <p>You can grow into more advanced payments when you are ready.</p>
          </div>
        </section>
      </footer>
    </main>
  );
}
