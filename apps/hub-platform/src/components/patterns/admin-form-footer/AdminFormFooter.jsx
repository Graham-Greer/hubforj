import { forwardRef } from "react";
import FormMessage from "@/components/ui/form-message/FormMessage";
import styles from "./AdminFormFooter.module.css";

const AdminFormFooter = forwardRef(function AdminFormFooter(
  { error = "", success = "", children },
  ref
) {
  return (
    <div ref={ref} className={styles.root}>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      {success ? <FormMessage tone="success">{success}</FormMessage> : null}
      <div className={styles.actions}>{children}</div>
    </div>
  );
});

export default AdminFormFooter;
