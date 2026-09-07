import Link from "next/link";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import SignInForm from "../../sign-in/SignInForm";

export const metadata = { title: "Recover workspace setup | Hubforj", robots: { index: false, follow: false } };

export default function RecoverSignupPage() {
  return (
    <MarketingShell>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <article className="route-card signup-form-card">
            <div className="section-heading">
              <h1 className="section-title">Continue your saved workspace setup</h1>
              <p className="section-copy">Sign in with the details you created during signup. We will use your saved community details to finish setup. Recovering setup does not start a paid subscription; you can review your package and continue checkout from your account.</p>
              <p className="section-copy">If no saved setup is available, return to your account for help. Older incomplete signups may need support to resolve.</p>
            </div>
            <SignInForm recoverSignup />
            <Link href="/sign-in" prefetch={false} className="button-link" data-variant="secondary">Return to account sign-in</Link>
          </article>
        </div>
      </section>
    </MarketingShell>
  );
}
