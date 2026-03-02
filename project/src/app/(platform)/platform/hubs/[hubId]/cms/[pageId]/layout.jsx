import styles from "./layout.module.css";

export default function HubCmsPageLayout({ children }) {
  return <div className={styles.root}>{children}</div>;
}
