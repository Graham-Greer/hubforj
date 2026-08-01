import Link from "next/link";

const defaultTestimonials = [
  {
    id: "testimonial-1",
    quote:
      "We moved from spreadsheets, patchy forms, and disconnected pages into one system that actually feels credible when both the team and our members use it.",
    name: "Aisha Rahman",
    role: "Community Director",
    organization: "Northfield Collective",
    initials: "AR",
  },
  {
    id: "testimonial-2",
    quote:
      "The biggest shift was confidence. Our public site, memberships, events, and payment workflows finally feel like one joined-up product instead of separate tools.",
    name: "Daniel Morgan",
    role: "Programme Lead",
    organization: "The Studio Network",
    initials: "DM",
  },
  {
    id: "testimonial-3",
    quote:
      "It gives our team a much cleaner rhythm. We can market the community well, welcome members properly, and manage the day-to-day without extra friction.",
    name: "Naomi Clarke",
    role: "Operations Manager",
    organization: "Founder Sessions",
    initials: "NC",
  },
];

function formatMeta({ role, organization }) {
  return [role, organization].filter(Boolean).join(" • ");
}

export default function TestimonialSection({
  eyebrow = "Testimonials",
  title = "Trusted by community operators who need the platform to look sharp and run cleanly.",
  description = "The strongest signal is when operators feel the public site, memberships, events, and admin workflows finally behave like one coherent product.",
  showCta = true,
  testimonials = defaultTestimonials,
}) {
  return (
    <section className="marketing-section">
      <div className="page-section page-section--wide content-stack">
        <div className="section-heading">
          <span className="eyebrow">{eyebrow}</span>
          <h2 className="section-title">{title}</h2>
          <p className="section-copy">{description}</p>
        </div>

        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article key={testimonial.id} className="testimonial-card">
              <div className="testimonial-quote-mark" aria-hidden="true">
                <span className="material-symbols-outlined">format_quote</span>
              </div>
              <blockquote className="testimonial-quote">“{testimonial.quote}”</blockquote>
              <div className="testimonial-attribution">
                <div className="testimonial-avatar" aria-hidden="true">
                  <span>{testimonial.initials}</span>
                </div>
                <div className="testimonial-identity">
                  <p className="testimonial-name">{testimonial.name}</p>
                  <p className="testimonial-meta">{formatMeta(testimonial)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {showCta ? (
          <div className="cta-band">
            <span className="eyebrow">Next step</span>
            <h2>Choose the right package, then start building with confidence.</h2>
            <p>Pick the package that fits today, then move straight into setting up your community with a clear next step.</p>
            <div className="button-row">
              <Link href="/signup" prefetch={false} className="button-link" data-variant="primary">
                Start your community
              </Link>
              <Link href="/pricing" prefetch={false} className="button-link" data-variant="secondary">
                Compare packages
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
