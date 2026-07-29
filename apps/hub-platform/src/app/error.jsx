"use client";

export default function RootError({ error, reset }) {
  return (
    <main className="appRoot">
      <section className="introPanel">
        <p className="eyebrow">Application Error</p>
        <h1 className="pageTitle">Something went wrong</h1>
        <p className="pageBody">{error?.message || "An unexpected error occurred."}</p>
        <button type="button" onClick={reset} className="actionButton">
          Try again
        </button>
      </section>
    </main>
  );
}
