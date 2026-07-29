import styles from "./SectionArticleLayout.module.css";

function SectionArticleLayoutMain({ className = "", children }) {
  return (
    <div className={[styles.main, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}

function SectionArticleLayoutAside({ className = "", children }) {
  return (
    <aside className={[styles.aside, className].filter(Boolean).join(" ")}>
      {children}
    </aside>
  );
}

export default function SectionArticleLayout({
  className = "",
  stickyAside = false,
  children,
}) {
  return (
    <div
      className={[
        styles.root,
        stickyAside ? styles.rootStickyAside : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

SectionArticleLayout.Main = SectionArticleLayoutMain;
SectionArticleLayout.Aside = SectionArticleLayoutAside;
