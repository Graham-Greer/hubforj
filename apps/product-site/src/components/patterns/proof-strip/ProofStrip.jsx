export default function ProofStrip({ items = [] }) {
  return (
    <div className="proof-strip">
      {items.map((item) => (
        <article key={item.label} className="metric-card">
          <span className="metric-label">{item.label}</span>
          <strong className="metric-value">{item.value}</strong>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}
