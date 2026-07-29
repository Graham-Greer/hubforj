"use client";

import { useCallback, useState } from "react";
import FormSectionTabs from "@/components/patterns/form-section-tabs/FormSectionTabs";
import Surface from "@/components/primitives/surface/Surface";
import Badge from "@/components/ui/badge/Badge";
import DataUseSummaryPanel from "./DataUseSummaryPanel";
import LegalDocumentEditor from "./LegalDocumentEditor";
import styles from "./LegalSettingsWorkspace.module.css";

const documentConfigs = {
  terms: {
    title: "Terms of Service",
    description: "Rules, memberships, payments, cancellations, refunds, and acceptable use.",
    helper: "",
    fallbackText: "Terms of Service have not yet been provided by this community.",
  },
  privacy: {
    title: "Privacy Policy",
    description: "Personal data, access, sharing, retention, and contact details.",
    helper: "",
    fallbackText: "Privacy Policy has not yet been provided by this community.",
  },
};

function getInitialDocumentId(legalSettings) {
  const reviewTargets = legalSettings?.legalStatus?.reviewTargets || {};
  const terms = legalSettings?.terms || {};
  const privacy = legalSettings?.privacy || {};

  if (!terms.hasOwnerProvidedContent) {
    return "terms";
  }

  if (!privacy.hasOwnerProvidedContent) {
    return "privacy";
  }

  if (Array.isArray(reviewTargets.terms) && reviewTargets.terms.length > 0) {
    return "terms";
  }

  if (Array.isArray(reviewTargets.privacy) && reviewTargets.privacy.length > 0) {
    return "privacy";
  }

  return "terms";
}

export default function LegalSettingsWorkspace({
  hubSlug,
  legalSettings,
  legacyUsefulLinksValues = null,
  canEdit,
  canSupportOverride = false,
}) {
  const [currentLegalSettings, setCurrentLegalSettings] = useState(legalSettings);
  const [activeDocumentId, setActiveDocumentId] = useState(() => getInitialDocumentId(legalSettings));
  const legalStatus = currentLegalSettings?.legalStatus || {};
  const activeDocumentConfig = documentConfigs[activeDocumentId] || documentConfigs.terms;
  const activeDocumentState = currentLegalSettings?.[activeDocumentId] || null;
  const activeLegacySuggestedContent = activeDocumentId === "privacy"
    ? legacyUsefulLinksValues?.privacyCustomBody || []
    : legacyUsefulLinksValues?.termsCustomBody || [];
  const activeHasLegacyContent = Array.isArray(activeLegacySuggestedContent) && activeLegacySuggestedContent.length > 0;
  const documentTabs = [
    {
      id: "terms",
      label: "Terms of Service",
      description: "Rules, memberships, payments, cancellations, and acceptable use.",
    },
    {
      id: "privacy",
      label: "Privacy Policy",
      description: "Personal data, access, sharing, retention, and contact details.",
    },
  ];

  const handleSaved = useCallback((nextLegalSettings) => {
    if (!nextLegalSettings) {
      return;
    }

    setCurrentLegalSettings(nextLegalSettings);
  }, []);

  return (
    <div className={styles.root}>
      <Surface tone="muted" padding="md" className={styles.statusBar}>
        <div className={styles.statusBadges}>
          <Badge tone={legalStatus.requiresOwnerReview ? "warning" : "success"}>
            {legalStatus.requiresOwnerReview ? "Review required" : "Up to date"}
          </Badge>
          <Badge tone={canEdit ? "accent" : "neutral"}>
            {canEdit ? "Owner access" : canSupportOverride ? "Support view" : "Read only"}
          </Badge>
          {!activeDocumentState?.hasOwnerProvidedContent && activeHasLegacyContent ? (
            <Badge tone="neutral">Legacy content ready</Badge>
          ) : null}
        </div>
      </Surface>

      <FormSectionTabs
        tabs={documentTabs}
        activeTabId={activeDocumentId}
        onTabChange={setActiveDocumentId}
        ariaLabel="Legal document type"
        showDescriptions={false}
      />

      <div className={styles.contentGrid}>
        <div
          id={`form-section-panel-${activeDocumentId}`}
          role="tabpanel"
          aria-labelledby={`form-section-tab-${activeDocumentId}`}
          className={styles.tabPanel}
        >
          <LegalDocumentEditor
            key={activeDocumentId}
            hubSlug={hubSlug}
            documentType={activeDocumentId}
            title={activeDocumentConfig.title}
            description={activeDocumentConfig.description}
            helper={activeDocumentConfig.helper}
            documentState={activeDocumentState}
            legacySuggestedContent={activeLegacySuggestedContent}
            fallbackText={activeDocumentConfig.fallbackText}
            canEdit={canEdit}
            reviewItems={legalStatus?.reviewTargets?.[activeDocumentId] || []}
            onSaved={handleSaved}
          />
        </div>

        <div className={styles.guidancePanel}>
          <DataUseSummaryPanel
            dataUseSummary={currentLegalSettings?.dataUseSummary}
            legalStatus={legalStatus}
            activeDocumentId={activeDocumentId}
          />
        </div>
      </div>
    </div>
  );
}
