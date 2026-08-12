"use client";

import { useMemo, useState } from "react";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Icon from "@/components/ui/icon/Icon";
import Modal from "@/components/ui/modal/Modal";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Notice from "@/components/ui/notice/Notice";
import {
  getStepIcon,
  getStepStatusLabel,
  getStepTone,
} from "./accountDomainViewModel";
import {
  providerInstructions,
  providerOptions,
} from "./accountDomainRegistrarProviders";
import styles from "./page.module.css";

export default function AccountDomainSetupGuide({ records = [], checks = [] }) {
  const [providerKey, setProviderKey] = useState("godaddy");
  const [modalOpen, setModalOpen] = useState(false);
  const provider = providerInstructions[providerKey] || providerInstructions.other;
  const visibleRecords = useMemo(() => records.filter((record) => record.copyName || record.copyValue), [records]);

  return (
    <div className={styles.setupGuide}>
      <Notice tone="info" icon="info" title="DNS changes can take time">
        <p>
          Most providers update within minutes, but some DNS changes can take up to 24-48 hours.
        </p>
      </Notice>

      <div className={styles.setupGuideIntro}>
        <h3 className={styles.noticeTitle}>Setup guide</h3>
        <p className={styles.capabilityDetail}>
          Follow these steps with your domain registrar to connect your domain.
        </p>
      </div>

      <div className={styles.setupGuideControls}>
        <AdminSelect
          name="domainRegistrar"
          label="Domain registrar"
          value={providerKey}
          onChange={(event) => setProviderKey(event.target.value)}
          options={providerOptions}
        />
        <Button type="button" variant="secondary" onClick={() => setModalOpen(true)}>
          View instructions
        </Button>
      </div>
      <p className={styles.registrarProviderHint}>Common location: {provider.path}</p>

      {checks.length ? (
        <ol className={styles.setupChecklist} aria-label="Custom domain setup guide checks">
          {checks.map((check, index) => (
            <li key={check.id} className={styles.setupChecklistItem} data-state={check.state}>
              <span className={styles.setupChecklistIcon} aria-hidden="true">
                <Icon name={getStepIcon(check.state)} size="sm" decorative />
              </span>
              <div className={styles.setupChecklistCopy}>
                <span className={styles.setupChecklistKicker}>Step {index + 1}</span>
                <div className={styles.setupChecklistTitleRow}>
                  <strong>{check.title}</strong>
                  <Badge tone={getStepTone(check.state)}>
                    {getStepStatusLabel(check.state)}
                  </Badge>
                </div>
                <p>{check.description}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {modalOpen ? (
        <Modal title={`${provider.label} DNS setup`} width="lg" variant="sheetOnMobile" onClose={() => setModalOpen(false)}>
          <div className={styles.registrarModalBody}>
            <div className={styles.registrarSummary}>
              <div>
                <span>Where to go</span>
                <strong>{provider.path}</strong>
              </div>
              <div>
                <span>Name field</span>
                <strong>{provider.nameLabel}</strong>
              </div>
              <div>
                <span>Value field</span>
                <strong>{provider.valueLabel}</strong>
              </div>
            </div>

            <ol className={styles.registrarSteps}>
              {provider.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            <div className={styles.registrarRecords}>
              <h3>Records to add or edit</h3>
              {visibleRecords.length ? (
                visibleRecords.map((record) => (
                  <div key={record.id} className={styles.registrarRecord}>
                    <strong>
                      {record.type} · {record.purpose}
                    </strong>
                    <span>
                      {provider.nameLabel}: <code>{record.name}</code>
                    </span>
                    <span>
                      {provider.valueLabel}: <code>{record.value}</code>
                    </span>
                    <span>TTL: {record.ttl}</span>
                  </div>
                ))
              ) : (
                <p className={styles.capabilityDetail}>
                  The exact DNS records will appear after the domain request has been prepared.
                </p>
              )}
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
