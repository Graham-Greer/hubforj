export default function SignupSteps({ items = [] }) {
  return (
    <div className="signup-steps">
      {items.map((item, index) => (
        <article key={item.title} className="signup-step">
          <span className="signup-step-index" aria-hidden="true">{index + 1}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}
