import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import { readCommercialAccountSession } from "@/lib/server/account-session";
import VerifyEmailActionCard from "./VerifyEmailActionCard";

export default async function VerifyEmailPage({ searchParams }) {
  const params = await searchParams;
  const session = await readCommercialAccountSession();
  const mode = String(params?.mode || "");
  const oobCode = String(params?.oobCode || "");
  const continueUrl = String(params?.continueUrl || "");
  const hasAccountSession = Boolean(session);

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Account verification</span>
            <h1 className="headline headline--section">Verify your account email.</h1>
            <p className="subcopy">We’ll verify your account email here, so you can finish setting up your community.</p>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <VerifyEmailActionCard mode={mode} oobCode={oobCode} continueUrl={continueUrl} hasAccountSession={hasAccountSession} />
          <div className="detail-grid">
            <article className="route-card">
              <h2>What happens next</h2>
              <ul className="detail-list">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>Confirm your account email address.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>{hasAccountSession ? "Return to your account." : "Sign in to your account."}</span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>Open the admin area for your community.</span>
                </li>
              </ul>
            </article>
            <article className="route-card">
              <h2>Need another email?</h2>
              <p>
                If this link has expired or you already closed the page, {hasAccountSession ? "open your account" : "sign in"}
                {" "}and request a fresh verification email there.
              </p>
              <div className="button-row">
                <Link href={hasAccountSession ? "/account" : "/sign-in"} className="button-link" data-variant="secondary">
                  {hasAccountSession ? "Open your account" : "Go to sign in"}
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
