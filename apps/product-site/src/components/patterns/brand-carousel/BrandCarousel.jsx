import Image from "next/image";

const brands = [
  { name: "Northfield Collective", src: "/images/brands/northfield-collective.svg" },
  { name: "Founder Sessions", src: "/images/brands/founder-sessions.svg" },
  { name: "Studio Gather", src: "/images/brands/studio-gather.svg" },
  { name: "Open Table Network", src: "/images/brands/open-table-network.svg" },
  { name: "Makers Circle", src: "/images/brands/makers-circle.svg" },
  { name: "Catalyst House", src: "/images/brands/catalyst-house.svg" },
];

function LogoItem({ brand }) {
  return (
    <div className="brand-marquee-item">
      <Image src={brand.src} alt={brand.name} width={320} height={96} className="brand-marquee-image" />
    </div>
  );
}

export default function BrandCarousel() {
  return (
    <section className="marketing-section brand-marquee-section" aria-labelledby="brand-marquee-title">
      <div className="page-section page-section--wide brand-marquee-shell">
        <div className="brand-marquee-header">
          <span className="eyebrow">Trusted by community builders</span>
          <p id="brand-marquee-title" className="brand-marquee-copy">
            Designed for organisations building modern membership, events, learning, and community experiences.
          </p>
        </div>

        <div className="brand-marquee" role="presentation">
          <div className="brand-marquee-track">
            {brands.map((brand) => (
              <LogoItem key={brand.name} brand={brand} />
            ))}
            {brands.map((brand) => (
              <LogoItem key={`${brand.name}-clone`} brand={brand} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
