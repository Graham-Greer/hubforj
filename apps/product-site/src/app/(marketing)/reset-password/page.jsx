import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import ResetPasswordActionCard from "./ResetPasswordActionCard";

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams;
  const mode = String(params?.mode || "");
  const oobCode = String(params?.oobCode || "");
  const continueUrl = String(params?.continueUrl || "");

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Password reset</span>
            <h1 className="headline headline--section">Choose a new password for your account.</h1>
            <p className="subcopy">Use this secure page to reset your password, then sign back in and continue with your Hubforj workspace.</p>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <ResetPasswordActionCard mode={mode} oobCode={oobCode} continueUrl={continueUrl} />
          <div className="detail-grid">
            <article className="route-card">
              <h2>What happens next</h2>
              <ul className="detail-list">
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>Create your new password here.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>Sign back in with your updated password.</span>
                </li>
                <li>
                  <span className="material-symbols-outlined" aria-hidden="true">
                    check_circle
                  </span>
                  <span>Return to your account and continue setup.</span>
                </li>
              </ul>
            </article>
            <article className="route-card">
              <h2>Need a new link?</h2>
              <p>If this reset link has expired or has already been used, request a fresh password reset email and we’ll send you a new one.</p>
              <div className="button-row">
                <Link href="/forgot-password" className="button-link" data-variant="secondary">
                  Request another reset email
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
