"use client";

import { useRef, useState } from "react";
import Heading from "@/components/primitives/heading/Heading";
import Text from "@/components/primitives/text/Text";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";
import styles from "./DomainListManager.module.css";

export default function DomainListManager({ hubId, domains, removeDomainAction }) {
  const submitRef = useRef(null);
  const [pendingDomain, setPendingDomain] = useState(null);

  return (
    <section className={styles.root}>
      <Heading as="h2" size="sm">Configured Domains</Heading>
      {domains.length ? (
        <ul className={styles.list}>
          {domains.map((domain) => (
            <li key={domain} className={styles.item}>
              <Text size="sm">{domain}</Text>
              <Button
                type="button"
                variant="tertiary"
                intent="danger"
                onClick={() => setPendingDomain(domain)}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <Text tone="secondary" size="sm">No custom domains configured.</Text>
      )}

      <form action={removeDomainAction} ref={submitRef}>
        <input type="hidden" name="hubId" value={hubId} />
        <input type="hidden" name="domain" value={pendingDomain || ""} />
      </form>

      <ConfirmModal
        open={Boolean(pendingDomain)}
        title="Remove custom domain?"
        message={pendingDomain ? `This will remove ${pendingDomain} from this hub.` : ""}
        confirmText="Remove domain"
        onCancel={() => setPendingDomain(null)}
        onConfirm={() => {
          submitRef.current?.requestSubmit();
          setPendingDomain(null);
        }}
      />
    </section>
  );
}

