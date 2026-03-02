"use client";

import { useEffect, useState } from "react";
import Button from "../button/Button";
import styles from "./ScrollToTop.module.css";

export default function ScrollToTop({ threshold = 240, behavior = "smooth" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <div className={styles.root}>
      <Button icon="arrow_upward" ariaLabel="Scroll to top" onClick={() => window.scrollTo({ top: 0, behavior })} />
    </div>
  );
}
