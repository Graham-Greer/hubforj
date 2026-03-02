import Link from "@/components/ui/link/Link";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import styles from "./FooterSection.module.css";

const VARIANTS = new Set(["simple", "columns", "cta"]);

function DefaultLinks({ linkGroups = [] }) {
  return (
    <div className={styles.links}>
      {linkGroups.map((group) => (
        <div key={group.label} className={styles.group}>
          <Text as="p" weight="semibold">{group.label}</Text>
          {group.links.map((item) => (
            <Link key={`${group.label}-${item.href}`} href={item.href} underline={false}>
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function FooterSection({
  variant = "simple",
  linkGroups = [],
  contact,
  cta,
}) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "simple";

  return (
    <footer className={[styles.root, styles[`variant_${resolvedVariant}`]].join(" ")}>
      <div className={styles.inner}>
        {resolvedVariant === "simple" ? (
          <Text tone="secondary">© {new Date().getFullYear()} Community Hub</Text>
        ) : null}

        {resolvedVariant === "columns" ? <DefaultLinks linkGroups={linkGroups} /> : null}

        {resolvedVariant === "cta" ? (
          <div className={styles.ctaWrap}>
            <Text as="p" weight="semibold">{cta?.title || "Stay connected"}</Text>
            <Text tone="secondary">{cta?.body || "Get updates about upcoming events and member news."}</Text>
            {cta?.href ? <Button href={cta.href} size="sm">{cta.label || "Join"}</Button> : null}
          </div>
        ) : null}

        {contact?.email ? (
          <Link href={`mailto:${contact.email}`} underline={false}>
            {contact.email}
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
