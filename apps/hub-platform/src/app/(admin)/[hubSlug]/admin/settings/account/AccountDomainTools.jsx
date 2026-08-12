"use client";

import { useState } from "react";
import Notice from "@/components/ui/notice/Notice";
import TaskSegmentedControl from "@/components/ui/task-segmented-control/TaskSegmentedControl";
import AccountDomainDnsRecordsTable from "./AccountDomainDnsRecordsTable";
import AccountDomainDisconnectForm from "./AccountDomainDisconnectForm";
import AccountDomainSetupGuide from "./AccountDomainSetupGuide";
import AccountDomainVerificationCheckForm from "./AccountDomainVerificationCheckForm";
import styles from "./page.module.css";

export default function AccountDomainTools({
  records = [],
  setupChecks = [],
  hubSlug,
  hostname,
  isConnected = false,
  showDisconnect = false,
  showVerification = false,
  failureReason = "",
  dnsRoutingFailureReason = "",
  activationBlockedReason = "",
}) {
  const options = [
    { value: "dns", label: isConnected ? "DNS configuration" : "DNS records", icon: "route" },
    { value: "guide", label: "Setup guide", icon: "menu_book" },
    ...(showDisconnect ? [{ value: "disconnect", label: "Disconnect", icon: "cancel" }] : []),
  ];
  const [selectedTool, setSelectedTool] = useState(options[0]?.value || "dns");

  return (
    <section className={styles.domainTools} aria-labelledby="custom-domain-tools-title">
      <div className={styles.domainToolsHeader}>
        <div className={styles.noticeCopy}>
          <h3 id="custom-domain-tools-title" className={styles.noticeTitle}>Domain tools</h3>
          <p className={styles.capabilityDetail}>Choose a task to manage your domain.</p>
        </div>
      </div>

      <TaskSegmentedControl
        ariaLabel="Domain task"
        value={selectedTool}
        onChange={setSelectedTool}
        options={options}
      />

      <div
        id={`task-panel-${selectedTool}`}
        role="tabpanel"
        aria-labelledby={`task-segment-${selectedTool}`}
        className={styles.domainToolPanel}
      >
        {selectedTool === "dns" ? (
          <>
            <p className={styles.capabilityDetail}>
              {isConnected
                ? "These are the DNS records currently expected for the connected custom domain."
                : "Add these records where your domain DNS is managed. This is often your registrar, but it may be a separate DNS provider."}
            </p>
            <AccountDomainDnsRecordsTable records={records} />
            <Notice tone="info" icon="info" title="DNS propagation">
              <p>
                DNS changes are often visible within minutes, but some providers can take 24-48 hours.
                {showVerification ? " After saving the records, use Check DNS." : ""}
              </p>
            </Notice>
            {failureReason ? (
              <Notice tone="danger" icon="warning" title="Setup needs attention">
                <p>{failureReason}</p>
              </Notice>
            ) : null}
            {dnsRoutingFailureReason ? (
              <Notice tone="danger" icon="warning" title="DNS routing needs attention">
                <p>{dnsRoutingFailureReason}</p>
              </Notice>
            ) : null}
            {activationBlockedReason ? (
              <Notice tone="warning" icon="sync" title="Connection pending">
                <p>{activationBlockedReason}</p>
              </Notice>
            ) : null}
            {showVerification ? <AccountDomainVerificationCheckForm hubSlug={hubSlug} /> : null}
          </>
        ) : null}

        {selectedTool === "guide" ? <AccountDomainSetupGuide records={records} checks={setupChecks} /> : null}

        {selectedTool === "disconnect" && showDisconnect ? (
          <AccountDomainDisconnectForm hubSlug={hubSlug} hostname={hostname} />
        ) : null}
      </div>
    </section>
  );
}
