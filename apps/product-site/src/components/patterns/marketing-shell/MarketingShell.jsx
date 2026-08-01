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
            <Link href="/pricing" prefetch={false}>Pricing</Link>
            {hasAccountSession ? (
              <>
                <Link href="/account" prefetch={false}>Account overview</Link>
                <Link href="/account/package" prefetch={false}>Manage package</Link>
              </>
            ) : (
              <>
                <Link href="/" prefetch={false}>Overview</Link>
                <Link href="/signup" prefetch={false}>Start your community</Link>
              </>
            )}
          </div>
          <div className="marketing-footer-column">
            <h3>{hasAccountSession ? "Your account" : "Get started"}</h3>
            {hasAccountSession ? (
              <>
                <Link href="/account" prefetch={false}>Account overview</Link>
                <Link href="/account/package" prefetch={false}>Package management</Link>
                <Link href="/account/billing" prefetch={false}>Billing</Link>
              </>
            ) : (
              <>
                <Link href="/pricing" prefetch={false}>View pricing</Link>
                <Link href="/signup" prefetch={false}>Create your community</Link>
                <Link href="/sign-in" prefetch={false}>Sign in</Link>
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
