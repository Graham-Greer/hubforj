"use client";

import AdminFormSection from "@/components/patterns/admin-form-section/AdminFormSection";
import Badge from "@/components/ui/badge/Badge";
import Accordion from "@/components/ui/accordion/Accordion";
import Surface from "@/components/primitives/surface/Surface";
import styles from "./LegalSettingsWorkspace.module.css";

const documentGuidance = {
  terms: {
    topics: [
      "Website and account rules",
      "Membership, event, and course rules",
      "Payments, refunds, and cancellations",
    ],
  },
  privacy: {
    topics: [
      "What personal data the hub collects",
      "Why it is used and who can access it",
      "How long it is kept and who to contact",
      "Any sharing or tools used outside the platform",
    ],
  },
};

const guidanceSteps = {
  terms: [
    "Use this guidance to decide what belongs in your Terms of Service.",
    "Add the policies your organisation controls, such as payments, refunds, cancellations, and participation rules.",
  ],
  privacy: [
    "Use this guidance to identify what data your hub collects through the platform.",
    "Add the decisions your organisation controls, such as retention, contact routes, and any data collected outside the platform.",
  ],
};

const ownerDecisionKeysByDocument = {
  terms: new Set([
    "Your organisation's legal name",
    "Your contact details",
    "Your refund and cancellation policy",
    "Your membership rules",
    "Your event rules",
    "Your course rules",
  ]),
  privacy: new Set([
    "Your organisation's legal name",
    "Your contact details",
    "How long you keep records",
    "Your marketing or contact preferences",
    "Any data you collect outside this platform",
    "Any third-party tools you use outside this platform",
  ]),
};

const summarySectionKeysByDocument = {
  terms: new Set([
    "public_site",
    "accounts",
    "memberships",
    "events",
    "courses",
    "payments",
    "admin_actions",
  ]),
  privacy: new Set([
    "public_site",
    "accounts",
    "memberships",
    "events",
    "courses",
    "payments",
    "media",
    "notifications",
    "admin_actions",
  ]),
};

function filterSummarySections(sections = [], activeDocumentId = "terms") {
  if (!Array.isArray(sections) || sections.length === 0) {
    return [];
  }

  const allowedKeys = summarySectionKeysByDocument[activeDocumentId] || summarySectionKeysByDocument.terms;

  return sections.filter((section) => allowedKeys.has(section?.key));
}

function filterOwnerDecisions(items = [], activeDocumentId = "terms") {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const allowedKeys = ownerDecisionKeysByDocument[activeDocumentId] || ownerDecisionKeysByDocument.terms;

  return items.filter((item) => {
    const normalized = String(item || "").trim();

    if (!normalized) {
      return false;
    }

    if (allowedKeys.has(normalized)) {
      return true;
    }

    if (activeDocumentId === "terms") {
      return /refund|cancel|membership|event|course|account/i.test(normalized);
    }

    return /data|retain|contact|marketing|third-party|privacy/i.test(normalized);
  });
}

function formatDateTime(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "Not generated yet";
  }

  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderList(items = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className={styles.previewEmpty}>Nothing to show yet.</p>;
  }

  return (
    <ul className={styles.bulletList}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function DataUseSummaryPanel({ dataUseSummary, legalStatus, activeDocumentId = "terms" }) {
  const sections = filterSummarySections(
    Array.isArray(dataUseSummary?.summary?.sections) ? dataUseSummary.summary.sections : [],
    activeDocumentId
  );
  const changeItems = Array.isArray(legalStatus?.reviewTargets?.[activeDocumentId])
    ? legalStatus.reviewTargets[activeDocumentId]
    : [];
  const activeGuidance = documentGuidance[activeDocumentId] || documentGuidance.terms;
  const activeSteps = guidanceSteps[activeDocumentId] || guidanceSteps.terms;
  const ownerDecisionItems = filterOwnerDecisions(
    dataUseSummary?.summary?.hubOwnerMustComplete,
    activeDocumentId
  );
  const accordionItems = [
    {
      id: "owner-decisions",
      title: activeDocumentId === "terms" ? "Terms decisions to define separately" : "Privacy decisions to define separately",
      content: renderList(ownerDecisionItems),
    },
    {
      id: "summary-status",
      title: "Summary details",
      content: (
        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Generated</p>
            <p className={styles.metaValue}>{formatDateTime(dataUseSummary?.generatedAt)}</p>
          </div>
          <div className={styles.metaItem}>
            <p className={styles.metaLabel}>Version</p>
            <p className={styles.metaValue}>{dataUseSummary?.generatorVersion || "Not available"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "platform-summary",
      title: "Platform data summary",
      content: (
        <div className={styles.summaryList}>
          {sections.map((section) => (
            <Surface key={section.key} tone="muted" padding="md" className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h3 className={styles.summaryTitle}>{section.title}</h3>
              </div>
              <div className={styles.summarySection}>
                <p className={styles.metaLabel}>In plain English</p>
                {renderList(section.plainEnglish)}
              </div>
              <div className={styles.summarySection}>
                <p className={styles.metaLabel}>Platform responsibility</p>
                <p className={styles.summaryBody}>{section.platformResponsibility}</p>
              </div>
              <div className={styles.summarySection}>
                <p className={styles.metaLabel}>Hub owner responsibility</p>
                <p className={styles.summaryBody}>{section.hubOwnerResponsibility}</p>
              </div>
              <div className={styles.summarySection}>
                <p className={styles.metaLabel}>Data involved</p>
                {renderList(section.dataFields)}
              </div>
            </Surface>
          ))}
        </div>
      ),
    },
  ];

  return (
    <AdminFormSection
      title="Guidance"
    >
      <div className={styles.summaryList}>
        <Surface tone="muted" padding="md" className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>How to use this guidance</h3>
          {renderList(activeSteps)}
        </Surface>

        <Surface tone="muted" padding="md" className={styles.summaryCard}>
          <h3 className={styles.summaryTitle}>Use this page for</h3>
          {renderList(activeGuidance.topics)}
        </Surface>

        <Accordion items={accordionItems.slice(0, 1)} allowMultiple />

        {changeItems.length ? (
          <Surface tone="muted" padding="md" className={styles.summaryCard}>
            <h3 className={styles.summaryTitle}>Review these changes</h3>
            <div className={styles.changeList}>
              {changeItems.map((item) => (
                <div key={item.key} className={styles.summarySection}>
                  <p className={styles.subheading}>{item.title}</p>
                  <p className={styles.changeDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        <Accordion items={accordionItems.slice(1)} allowMultiple />
      </div>
    </AdminFormSection>
  );
}
