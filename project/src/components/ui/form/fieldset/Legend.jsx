import styles from "./Legend.module.css";

export default function Legend({ children }) {
  return <legend className={styles.root}>{children}</legend>;
}
