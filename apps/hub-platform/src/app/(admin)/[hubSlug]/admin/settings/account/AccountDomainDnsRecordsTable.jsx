"use client";

import Icon from "@/components/ui/icon/Icon";
import AccountDomainCopyButton from "./AccountDomainCopyButton";
import styles from "./page.module.css";

export default function AccountDomainDnsRecordsTable({ records = [] }) {
  if (!records.length) {
    return (
      <p className={styles.capabilityDetail}>
        DNS records will appear here after the domain request has been prepared.
      </p>
    );
  }

  return (
    <div className={styles.dnsRecordsTable} aria-label="Custom domain DNS records">
      {records.map((record) => (
        <article key={record.id} className={styles.dnsRecordRow}>
          <div className={styles.dnsRecordHeading}>
            <span className={styles.dnsRecordIcon} aria-hidden="true">
              <Icon name={record.type === "TXT" ? "task_alt" : "route"} size="sm" decorative />
            </span>
            <div className={styles.dnsRecordTitle}>
              <strong>{record.purpose}</strong>
              <span>{record.type} record</span>
            </div>
          </div>
          <div className={styles.dnsRecordFields}>
            <div className={styles.dnsRecordField}>
              <span>Host</span>
              <div className={styles.dnsRecordValue}>
                <code>{record.name}</code>
                <AccountDomainCopyButton value={record.copyName} label="Copy" />
              </div>
            </div>
            <div className={styles.dnsRecordField}>
              <span>Value</span>
              <div className={styles.dnsRecordValue}>
                <code>{record.value}</code>
                <AccountDomainCopyButton value={record.copyValue} label="Copy" />
              </div>
            </div>
            <div className={styles.dnsRecordField}>
              <span>TTL</span>
              <div className={styles.dnsRecordValue}>
                <strong>{record.ttl}</strong>
                <AccountDomainCopyButton value={record.ttl} label="Copy" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
