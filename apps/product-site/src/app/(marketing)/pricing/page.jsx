import Link from "next/link";
import FaqSection from "@/components/patterns/faq-section/FaqSection";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import PricingPackageExplorer from "@/components/patterns/package-catalog/PricingPackageExplorer";
import { readCommercialAccountSession } from "@/lib/server/account-session";

export default async function PricingPage() {
  const session = await readCommercialAccountSession();
  const hasAccountSession = Boolean(session);
  const primarySignupHref = hasAccountSession ? "/account/package" : "/signup?tier=starter";
  const primarySignupLabel = hasAccountSession ? "Manage your package" : "Start your community";
  const faqItems = [
    {
      question: "Which package should I start with?",
      answer:
        "Choose the package that matches where your community is today. Free is for getting started, Starter is for selling memberships and offers with external checkout, and Growth is for teams that want a more integrated premium setup.",
    },
    {
      question: "Can I upgrade later as the community grows?",
      answer:
        "Yes. You can start with the package that fits your current stage and move up when you need stronger monetisation, payments, branding control, or scale.",
    },
    {
      question: "What is the difference between Starter and Growth for payments?",
      answer:
        "Starter lets you sell memberships, events, and courses while taking payment externally. Growth is for communities that want built-in payments and a more joined-up experience.",
    },
    {
      question: "Do I need Growth from day one?",
      answer:
        "Usually not. Growth is best when your community is already gaining traction and you want native payments, stronger branding control, and fewer manual workarounds.",
    },
    {
      question: "What happens after I choose a package?",
      answer:
        "You can move straight into creating your community, choosing your package, and setting up the first version of your website and admin area.",
    },
  ];

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Pricing</span>
            <h1 className="headline headline--section">Simple pricing for communities to <span className="gradient-text">grow with confidence.</span></h1>
            <p className="subcopy">
              Choose the package that fits your stage today, then upgrade when you need stronger monetisation, payments, and brand control. Clear packages. No unnecessary complexity.
            </p>
            <div className="button-row">
              <Link
                href={primarySignupHref}
                prefetch={false}
                className="button-link"
                data-variant="primary"
              >
                {primarySignupLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <div className="pricing-proof-grid">
            <article className="feature-card">
              <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
              <h3>Start simply</h3>
              <p>Launch with the essentials you need to publish your community and begin building momentum.</p>
            </article>
            <article className="feature-card">
              <span className="material-symbols-outlined" aria-hidden="true">sell</span>
              <h3>Sell confidently</h3>
              <p>Introduce paid memberships, events, and courses with a simple setup that stays flexible.</p>
            </article>
            <article className="feature-card">
              <span className="material-symbols-outlined" aria-hidden="true">auto_graph</span>
              <h3>Scale cleanly</h3>
              <p>Upgrade into native payments, stronger brand control, and a more premium operating model when you&apos;re ready.</p>
            </article>
          </div>
          <PricingPackageExplorer
            hasAccountSession={hasAccountSession}
          />
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <FaqSection
            eyebrow="Pricing questions"
            title="Questions teams ask before they choose a package."
            description="These answers are here to make the decision easier, clearer, and faster before you start setting up your community."
            items={faqItems}
          />
        </div>
      </section>
    </MarketingShell>
  );
}
