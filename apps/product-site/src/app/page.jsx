import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import BrandCarousel from "@/components/patterns/brand-carousel/BrandCarousel";
import MarketingShell from "@/components/patterns/marketing-shell/MarketingShell";
import TestimonialSection from "@/components/patterns/testimonial-section/TestimonialSection";
import { readCommercialAccountSession } from "@/lib/server/account-session";

export default async function HomePage() {
  const session = await readCommercialAccountSession();

  if (session) {
    redirect("/account");
  }

  return (
    <MarketingShell>
      <section className="marketing-hero-section">
        <div className="page-section page-section--wide">
          <div className="hero-grid hero-grid--product">
            <div className="hero-copy hero-copy--wide">
              <span className="eyebrow">Community platform for modern operators</span>
              <h1 className="headline">
                Run your community on <span className="gradient-text">one platform</span> that looks professional and is <span className="gradient-text">easy to manage.</span>
              </h1>
              <p className="subcopy">
                Hubforj brings your website, memberships, events, courses, and admin operations into one clean system so you can grow with more confidence and less friction.
              </p>
              <div className="hero-actions">
                <Link href="/signup" className="button-link" data-variant="primary">
                  Start your community
                </Link>
                <Link href="/pricing" className="button-link" data-variant="secondary">
                  View pricing
                </Link>
              </div>
            </div>
            <div className="product-visual product-visual--hero" aria-label="Hubforj product preview">
              <Image
                src="/images/product-admin-preview.svg"
                alt="Preview of the Hubforj admin workspace."
                width={1440}
                height={980}
                className="product-image"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <div className="proof-band">
            <article className="proof-band-item">
              <span className="material-symbols-outlined" aria-hidden="true">public</span>
              <div>
                <strong>One joined-up experience</strong>
                <p>Your website and admin area finally feel like parts of the same product.</p>
              </div>
            </article>
            <article className="proof-band-item">
              <span className="material-symbols-outlined" aria-hidden="true">payments</span>
              <div>
                <strong>Clear path to monetisation</strong>
                <p>Start simply, introduce paid offers when you are ready, and upgrade into native payments later.</p>
              </div>
            </article>
            <article className="proof-band-item">
              <span className="material-symbols-outlined" aria-hidden="true">shield_lock</span>
              <div>
                <strong>Built for serious operators</strong>
                <p>Everything is structured to help you launch credibly, stay organised, and grow without messy workarounds.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <BrandCarousel />

      <section className="marketing-section">
        <div className="page-section page-section--wide content-stack">
          <div className="section-heading">
            <span className="eyebrow">Why teams choose it</span>
            <h2 className="section-title">Built for communities that want to look credible, sell clearly, and stay easy to run.</h2>
            <p className="section-copy">
              The value is not just in having more features. It is in having a cleaner system that helps your team market the community well, manage it confidently, and keep the member experience joined up.
            </p>
          </div>
          <div className="showcase-stack">
            <article className="showcase-row">
              <div className="showcase-copy">
                <div className="subsection-heading">
                  <span className="eyebrow">Admin clarity</span>
                  <h3>Give your team one place to manage the moving parts.</h3>
                  <p>
                    Members, memberships, registrations, attendance, and payment follow-up all sit in one connected workflow instead of being spread across disconnected tools.
                  </p>
                </div>
                <ul className="showcase-list">
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Find the right member, booking, or payment task quickly</span></li>
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Handle memberships, events, and courses in one consistent admin experience</span></li>
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Keep daily operations clear as the community grows</span></li>
                </ul>
              </div>
              <div className="product-visual">
                <Image
                  src="/images/product-admin-preview.svg"
                  alt="Preview of the admin experience for managing members, events, and payments."
                  width={1440}
                  height={980}
                  className="product-image"
                />
              </div>
            </article>
            <article className="showcase-row showcase-row--reverse">
              <div className="showcase-copy">
                <div className="subsection-heading">
                  <span className="eyebrow">Public site that converts</span>
                  <h3>Turn your website into a front door people actually trust.</h3>
                  <p>
                    Give visitors a clear sense of what your community offers, why it matters, and what to do next without sending them through a cluttered or confusing experience.
                  </p>
                </div>
                <ul className="showcase-list">
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Showcase memberships, events, and courses with clear next steps</span></li>
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Use structured sections that explain the offer without unnecessary noise</span></li>
                  <li><span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span>Present a polished brand without sacrificing clarity or usability</span></li>
                </ul>
              </div>
              <div className="product-visual">
                <Image
                  src="/images/product-site-preview.svg"
                  alt="Preview of the public community website experience."
                  width={1440}
                  height={980}
                  className="product-image"
                />
              </div>
            </article>
          </div>
        </div>
      </section>

      <TestimonialSection />
    </MarketingShell>
  );
}
