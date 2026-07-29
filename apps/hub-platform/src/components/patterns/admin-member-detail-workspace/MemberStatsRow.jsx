import StatCard from "@/components/ui/stat-card/StatCard";
import { summarizePaymentItems } from "@/lib/domain/memberships";
import { getTotalMemberBookings } from "./admin-member-detail-helpers";
import styles from "./AdminMemberDetailWorkspace.module.css";

export default function MemberStatsRow({ detail }) {
  const paymentSummary = summarizePaymentItems(detail.paymentItems);
  const totalBookings = getTotalMemberBookings(detail);

  return (
    <div className={styles.stats}>
      <StatCard label="Bookings" value={String(totalBookings)} detail="Combined event and course participation." />
      <StatCard label="Payment items" value={String(paymentSummary.total)} detail="Membership and booking obligations." />
      <StatCard label="Action required" value={String(paymentSummary.due)} detail="Items still unpaid or overdue." />
    </div>
  );
}
