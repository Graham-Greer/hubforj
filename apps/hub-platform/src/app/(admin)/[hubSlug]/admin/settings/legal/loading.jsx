import { AdminLegalSettingsFallback } from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import styles from "../settings.module.css";

export default function LegalSettingsLoading() {
  return (
    <div className={styles.layout}>
      <AdminLegalSettingsFallback />
    </div>
  );
}
