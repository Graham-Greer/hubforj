"use client";

import { useMemo, useState } from "react";
import Button from "@/components/ui/button/Button";
import Modal from "@/components/ui/modal/Modal";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import {
  providerInstructions,
  providerOptions,
} from "./accountDomainRegistrarProviders";
import styles from "./page.module.css";

export default function AccountDomainRegistrarGuide({ records = [] }) {
  const [providerKey, setProviderKey] = useState("godaddy");
  const [modalOpen, setModalOpen] = useState(false);
  const provider = providerInstructions[providerKey] || providerInstructions.other;
  const visibleRecords = useMemo(() => records.filter((record) => record.copyName || record.copyValue), [records]);

  return (
    <>
      <p className={styles.capabilityDetail}>
        Choose the company where this domain's DNS records are managed, then open a focused checklist for the records to add or edit.
      </p>
      <div className={styles.registrarGuideControls}>
        <AdminSelect
          name="domainRegistrar"
          label="DNS provider"
          labelVisibility="hidden"
          value={providerKey}
          onChange={(event) => setProviderKey(event.target.value)}
          options={providerOptions}
        />
        <Button type="button" variant="secondary" onClick={() => setModalOpen(true)}>
          View instructions
        </Button>
      </div>
      <p className={styles.registrarProviderHint}>Common location: {provider.path}</p>

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
    </>
  );
}
