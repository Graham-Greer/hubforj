"use client";

import { useState } from "react";

export default function FaqSection({ eyebrow, title, description, items = [] }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section" aria-labelledby="pricing-faq-title">
      <div className="section-heading section-heading--wide">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 id="pricing-faq-title" className="section-title">
          {title}
        </h2>
        {description ? <p className="section-copy">{description}</p> : null}
      </div>
      <div className="faq-list">
        {items.map((item, index) => {
          const isOpen = index === openIndex;

          return (
            <article key={item.question} className="faq-item" data-open={isOpen ? "true" : "false"}>
              <button
                type="button"
                className="faq-trigger"
                aria-expanded={isOpen ? "true" : "false"}
                onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
              >
                <span>{item.question}</span>
                <span className="material-symbols-outlined faq-icon" aria-hidden="true">
                  expand_more
                </span>
              </button>
              {isOpen ? (
                <div className="faq-panel">
                  <p>{item.answer}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
