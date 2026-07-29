import styles from "./SocialIcon.module.css";

export default function SocialIcon({ network, className = "" }) {
  const classes = [styles.root, className].filter(Boolean).join(" ");

  if (network === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={classes}>
        <path fill="currentColor" d="M13.5 21v-7h2.3l.4-3h-2.7V9.1c0-.9.3-1.6 1.7-1.6H16V4.8c-.2 0-.9-.1-1.9-.1-2.8 0-4.6 1.7-4.6 4.8V11H7v3h2.6v7h3.9Z" />
      </svg>
    );
  }

  if (network === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={classes}>
        <path
          fill="currentColor"
          d="M7.8 3h8.4A4.8 4.8 0 0 1 21 7.8v8.4a4.8 4.8 0 0 1-4.8 4.8H7.8A4.8 4.8 0 0 1 3 16.2V7.8A4.8 4.8 0 0 1 7.8 3Zm-.2 1.8A2.8 2.8 0 0 0 4.8 7.6v8.8a2.8 2.8 0 0 0 2.8 2.8h8.8a2.8 2.8 0 0 0 2.8-2.8V7.6a2.8 2.8 0 0 0-2.8-2.8H7.6Zm9.3 1.4a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
        />
      </svg>
    );
  }

  if (network === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={classes}>
        <path
          fill="currentColor"
          d="M6.1 8.3a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6ZM4.5 9.7h3.2V19H4.5V9.7Zm5.2 0h3v1.3h.1c.4-.8 1.5-1.7 3.2-1.7 3.4 0 4 2.1 4 4.9V19h-3.2v-4.2c0-1 0-2.3-1.5-2.3s-1.7 1.1-1.7 2.2V19H9.7V9.7Z"
        />
      </svg>
    );
  }

  if (network === "x") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className={classes}>
        <g transform="translate(3 3) scale(1.125)">
          <path
            fill="currentColor"
            d="M12.6 0.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H0.316l5.733-6.57L0 0.75h5.063l3.495 4.633L12.601 0.75Zm-.86 13.028h1.36L4.323 2.145H2.865z"
          />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={classes}>
      <path
        fill="currentColor"
        d="M21.6 7.2a3.3 3.3 0 0 0-2.3-2.3C17.2 4.3 12 4.3 12 4.3s-5.2 0-7.3.6A3.3 3.3 0 0 0 2.4 7.2a34 34 0 0 0-.5 4.8c0 1.6.2 3.2.5 4.8a3.3 3.3 0 0 0 2.3 2.3c2.1.6 7.3.6 7.3.6s5.2 0 7.3-.6a3.3 3.3 0 0 0 2.3-2.3c.3-1.6.5-3.2.5-4.8 0-1.6-.2-3.2-.5-4.8ZM10.1 15.3V8.7l5.7 3.3-5.7 3.3Z"
      />
    </svg>
  );
}
