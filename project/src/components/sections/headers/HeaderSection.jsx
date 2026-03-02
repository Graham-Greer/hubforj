import Link from "@/components/ui/link/Link";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/primitives/icon/Icon";
import styles from "./HeaderSection.module.css";

const VARIANTS = new Set(["standard", "minimal", "landing"]);

export default function HeaderSection({
  variant = "standard",
  navItems = [],
  cta,
  showThemeToggle = false,
}) {
  const resolvedVariant = VARIANTS.has(variant) ? variant : "standard";

  return (
    <header className={[styles.root, styles[`variant_${resolvedVariant}`]].join(" ")}>
      <div className={styles.inner}>
        <Link href={navItems[0]?.href || "/"} className={styles.brand} underline={false}>
          Community Hub
        </Link>

        {resolvedVariant !== "minimal" ? (
          <nav className={styles.nav} aria-label="Primary">
            {navItems.map((item) => (
              <Link key={`${item.href}-${item.label}`} href={item.href} underline={false}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className={styles.actions}>
          {showThemeToggle ? (
            <span className={styles.iconWrap} aria-hidden="true">
              <Icon name="light_mode" decorative />
            </span>
          ) : null}
          {cta ? (
            <Button href={cta.href} size="sm" variant={resolvedVariant === "landing" ? "primary" : "secondary"}>
              {cta.label}
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
