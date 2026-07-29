import Link from "next/link";
import { redirect } from "next/navigation";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import SignupProvisionForm from "./SignupProvisionForm";
import SignupSteps from "@/components/patterns/signup-steps/SignupSteps";
import TestimonialSection from "@/components/patterns/testimonial-section/TestimonialSection";
import { resolvePackagePricingSelection } from "@/lib/domain/package-pricing";
import { readCommercialAccountSession } from "@/lib/server/account-session";

function normalizeString(value) {
  return String(value || "").trim();
}

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const session = await readCommercialAccountSession();

  if (session) {
    redirect("/account/package");
  }

  const packagePricingSelection = resolvePackagePricingSelection({
    tier: normalizeString(params?.tier).toLowerCase() || "starter",
  });
  const initialValues = {
    packageTier: normalizeString(params?.tier).toLowerCase(),
    packageCurrency: packagePricingSelection.currency,
  };
  const steps = [
    {
      title: "Choose package",
      body: "Pick the plan that fits your current stage so your community starts on the right footing.",
    },
    {
      title: "Claim your hub",
      body: "Add the community name, secure password, and hub address you want to launch with.",
    },
    {
      title: "Start setup",
      body: "Move straight into branding, content, and your community operations.",
    },
  ];
  const signupTestimonials = [
    {
      id: "signup-testimonial-1",
      quote:
        "We needed something that looked professional from day one. Hubforj gave us a credible public site and a clear admin setup without a long implementation project.",
      name: "Sophie Bennett",
      role: "Founder",
      organization: "Neighbourhood Works",
      initials: "SB",
    },
    {
      id: "signup-testimonial-2",
      quote:
        "The signup flow made it easy to get moving. We chose the right package, created the workspace, and started setting up the community the same day.",
      name: "Marcus Lee",
      role: "Programme Director",
      organization: "Gather North",
      initials: "ML",
    },
    {
      id: "signup-testimonial-3",
      quote:
        "What sold it for us was how joined-up it felt. We were not buying one tool for the website and another for operations. It already felt like one product.",
      name: "Hannah Doyle",
      role: "Operations Lead",
      organization: "The Circle Project",
      initials: "HD",
    },
  ];

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="section-heading section-heading--wide">
            <span className="eyebrow">Signup</span>
            <h1 className="headline headline--section"><span className="gradient-text">Launch your community</span> with a platform that looks credible and runs cleanly from day one.</h1>
            <p className="subcopy">Choose your package, create your workspace, and move straight into setting up the community experience you want people to join.</p>
            <div className="button-row">
              <Link href="/pricing" className="button-link" data-variant="secondary">
                Compare packages
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <div className="section-heading">
            <span className="eyebrow">How it works</span>
            <h2 className="section-title">Three clear steps to get your community live.</h2>
            <p className="section-copy">We keep the signup journey simple so you can make a confident package choice, claim your space, and start managing your community straight away.</p>
          </div>
          <SignupSteps items={steps} />
          <article className="route-card signup-form-card">
            <div className="section-heading">
              <span className="eyebrow">Create your community</span>
              <h2 className="section-title">Enter the essentials and create your workspace.</h2>
              <p className="section-copy">Once your community is created, you can move into branding, pages, memberships, events, and courses with a clear starting point.</p>
            </div>
            <SignupProvisionForm
              initialValues={initialValues}
            />
          </article>
        </div>
      </section>

      <TestimonialSection
        eyebrow="Customer feedback"
        title="See why community teams feel confident choosing Hubforj."
        description="From first impression to day-to-day delivery, Hubforj gives teams a cleaner way to launch, manage, and grow their community."
        showCta={false}
        testimonials={signupTestimonials}
      />
    </MarketingShell>
  );
}
