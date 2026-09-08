import Link from "next/link";
import { redirect } from "next/navigation";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import { readCommercialAccountSession } from "@/lib/server/account-session";
import SignInForm from "./SignInForm";

export default async function SignInPage({ searchParams }) {
  const params = await searchParams;
  const session = await readCommercialAccountSession();

  if (session) {
    redirect("/account");
  }

  const nextPath = String(params?.next || "/account");
  const verified = String(params?.verified || "") === "1";
  const passwordReset = String(params?.reset || "") === "1";

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Sign in</span>
            <h1 className="headline headline--section">Return to your account.</h1>
            <p className="subcopy">Manage your package, billing, and next steps without starting from scratch.</p>
            <div className="button-row">
              <Link href="/signup" prefetch={false} className="button-link" data-variant="secondary">
                Create a new community
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <article className="route-card signup-form-card">
            <div className="section-heading">
              <span className="eyebrow">Your account</span>
              <h2 className="section-title">Sign in to manage your package and billing.</h2>
              <p className="section-copy">Use the same email and password you created when you set up your community.</p>
            </div>
            {verified ? <div className="form-message" data-tone="success">Your email has been verified. Sign in to continue.</div> : null}
            {passwordReset ? <div className="form-message" data-tone="success">Your password has been updated. Sign in with your new password.</div> : null}
            <SignInForm nextPath={nextPath} />
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
