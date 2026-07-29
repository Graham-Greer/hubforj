import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage({ searchParams }) {
  const defaultEmail = String((await searchParams)?.email || "");

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Password reset</span>
            <h1 className="headline headline--section">Reset your account password.</h1>
            <p className="subcopy">We’ll send you a secure link so you can get back into your account quickly.</p>
            <div className="button-row">
              <Link href="/sign-in" className="button-link" data-variant="secondary">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <article className="route-card signup-form-card">
            <div className="section-heading">
              <span className="eyebrow">Account recovery</span>
              <h2 className="section-title">Send a secure password reset link.</h2>
              <p className="section-copy">Use the same email address you used when you created your account.</p>
            </div>
            <ForgotPasswordForm defaultEmail={defaultEmail} />
          </article>
          <article className="route-card">
            <h2>Still blocked?</h2>
            <p>If your community already exists but you no longer have access to the email or password, contact support using the same email address you signed up with so we can help safely.</p>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
