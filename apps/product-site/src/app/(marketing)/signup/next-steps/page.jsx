import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import SignupSteps from "@/components/patterns/signup-steps/SignupSteps";

function normalizeTierLabel(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (normalizedValue === "growth") {
    return "Growth";
  }

  if (normalizedValue === "starter") {
    return "Starter";
  }

  return "Paid package";
}

export default async function SignupNextStepsPage({ searchParams }) {
  const params = await searchParams;
  const packageTier = String(params?.packageTier || "");
  const verification = String(params?.verification || "retry");
  const hubSlug = String(params?.hubSlug || "");
  const verificationSent = verification === "sent" || verification === "logged";
  const tierLabel = normalizeTierLabel(packageTier);
  const steps = [
    {
      title: "Check inbox",
      body: verificationSent
        ? "Open the verification email we just sent to the account owner address."
        : "Open your account and send a fresh verification email before continuing.",
    },
    {
      title: "Verify email",
      body: "Confirm the email address connected to your community account.",
    },
    {
      title: "Open admin area",
      body: "Return to your account and open your admin area.",
    },
  ];

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Payment confirmed</span>
            <h1 className="headline headline--section">Verify your email to finish account activation.</h1>
            <p className="subcopy">Your next step is to check your inbox and verify your email address connected to your community&apos;s account.</p>
            <div className="status-row">
              {packageTier ? <span className="status-chip">{tierLabel}</span> : null}
              {hubSlug ? <span className="status-chip" data-tone="accent">{hubSlug}</span> : null}
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <SignupSteps items={steps} />
          {!verificationSent ? (
            <article className="route-card">
              <h2>Verification email needs attention</h2>
              <p>We could not confirm email delivery from this environment. Open your account and resend the verification email before activating your Hubforj workspace.</p>
              <div className="button-row">
                <Link href="/account" className="button-link" data-variant="primary">
                  Open your account
                </Link>
              </div>
            </article>
          ) : null}
        </div>
      </section>
    </MarketingShell>
  );
}
