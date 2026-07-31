import Image from "next/image";
import Link from "next/link";
import DashboardSection from "./DashboardSection";
import rowStyles from "./DashboardRows.module.css";

function renderPlaceholder(title) {
  const initial = String(title || "?").trim().charAt(0).toUpperCase() || "?";

  return <div className={rowStyles.placeholder}>{initial}</div>;
}

export default function DashboardPanel({ title, href, items = [], kind = "event" }) {
  return (
    <DashboardSection title={title} href={href}>
      {items.length ? (
        <div className={rowStyles.list}>
          {items.map((item) => (
            <Link key={item.id} href={item.href} prefetch={false} className={`${rowStyles.mediaRow} ${rowStyles.interactive}`}>
              <div className={rowStyles.mediaWrap}>
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.imageAlt} fill sizes="72px" className={rowStyles.media} />
                ) : (
                  renderPlaceholder(item.title)
                )}
              </div>
              <div className={rowStyles.content}>
                <strong className={rowStyles.title}>{item.title}</strong>
                {kind === "event" ? (
                  <div className={rowStyles.metaLine}>
                    <span>{item.dateLabel}</span>
                    <span>&bull;</span>
                    <span>{item.registeredCount} registered</span>
                  </div>
                ) : null}
                <div className={rowStyles.metaLine}>
                  {kind === "course" ? (
                    <span>{item.enrolledCount} enrolled</span>
                  ) : null}
                </div>
              </div>
              {kind === "course" && item.revenueLabel ? (
                <span className={rowStyles.sideMeta}>{item.revenueLabel}</span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : (
        <p className={rowStyles.empty}>
          {kind === "event"
            ? "Published upcoming events will appear here."
            : "Published upcoming courses will appear here."}
        </p>
      )}
    </DashboardSection>
  );
}
