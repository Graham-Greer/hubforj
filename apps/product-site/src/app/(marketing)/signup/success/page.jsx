import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import { getServerEnv } from "@/lib/config/env";
import { buildOperationalHandoffUrls } from "@/lib/domain/signup";

export default async function SignupSuccessPage({ searchParams }) {
  const params = await searchParams;
  const hubId = String(params?.hubId || "");
  const hubSlug = String(params?.hubSlug || "");
  const packageTier = String(params?.packageTier || "");
  const verification = String(params?.verification || "retry");
  const { hubPlatformBaseUrl } = getServerEnv();
  const handoff = buildOperationalHandoffUrls({
    hubPlatformBaseUrl,
    hubSlug,
  });
  const verificationSent = verification === "sent" || verification === "logged";

  return (
    <MarketingShell>
      <section className="content-stack">
        <div className="cta-band">
          <span className="eyebrow">Community created</span>
          <h2>Your community is ready. Verify your email to keep going.</h2>
          <p>
            The next step is to confirm the email address linked to your account so you can finish setup and open your admin area.
          </p>
          <div className="status-row">
            {hubSlug ? <span className="status-chip" data-tone="accent">{hubSlug}</span> : null}
            {packageTier ? <span className="status-chip">{packageTier}</span> : null}
            {hubId ? <span className="status-chip">{hubId}</span> : null}
          </div>
          <div className="button-row">
            <Link href="/account" prefetch={false} className="button-link" data-variant="primary">
              Open your account
            </Link>
            <Link href="/sign-in" prefetch={false} className="button-link" data-variant="secondary">
              Return to sign in
            </Link>
          </div>
        </div>
        <article className="route-card">
          <h2>{verificationSent ? "Check your inbox" : "Verification email still needs attention"}</h2>
          <p>
            {verificationSent
              ? "We have sent your verification email. Once you confirm the address, sign back in and continue."
              : "We could not confirm email delivery in this environment yet. Open your account and send the verification email again before continuing."}
          </p>
        </article>
        <div className="detail-grid">
          <article className="route-card">
            <h2>What happened here</h2>
            <ul className="detail-list">
              <li>Your community website and admin area were created.</li>
              <li>Your chosen package was saved to your account.</li>
              <li>Your account is ready and waiting for email verification.</li>
            </ul>
          </article>
          <article className="route-card">
            <h2>What comes next</h2>
            <ul className="detail-list">
              <li>Verify your email address.</li>
              <li>Open your account and finish setup.</li>
              <li>Sign in to your admin area with the same email and password you just created.</li>
            </ul>
          </article>
        </div>
        {handoff.publicHref ? (
          <article className="route-card">
            <h2>Your website is live</h2>
            <p>
              Your community website is already available while you finish verifying your account and opening the admin area.
            </p>
            <div className="button-row">
              <Link href={handoff.publicHref} prefetch={false} className="button-link" data-variant="secondary">
                Open public site
              </Link>
            </div>
          </article>
        ) : null}
      </section>
    </MarketingShell>
  );
}
