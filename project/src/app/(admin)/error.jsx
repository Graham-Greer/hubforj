"use client";

export default function AdminError({ reset }) {
  return (
    <main>
      <h2>Admin error</h2>
      <button type="button" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}

