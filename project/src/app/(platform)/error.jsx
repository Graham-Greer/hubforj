"use client";

export default function PlatformError({ reset }) {
  return (
    <main>
      <h2>Platform error</h2>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}

