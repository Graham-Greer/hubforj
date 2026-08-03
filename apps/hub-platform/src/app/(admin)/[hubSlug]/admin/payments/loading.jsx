import PageHeader from "@/components/patterns/page-header/PageHeader";
import {
  AdminMembershipPlansFallback,
  AdminPaymentRecordsFallback,
  AdminPaymentSetupFallback,
} from "@/components/patterns/admin-route-fallbacks/AdminRouteFallbacks";
import { headers } from "next/headers";
import styles from "./page.module.css";

function getSelectedView(search) {
  const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
  const view = params.get("view");

  return view === "plans" ? "plans" : view === "payments" ? "payments" : "setup";
}

function getPaymentsHeaderCopy(selectedView) {
  if (selectedView === "payments") {
    return {
      eyebrow: "Payments",
      title: "Payments and reporting",
      description: "Review membership, event, and course payments in one place.",
    };
  }

  if (selectedView === "plans") {
    return {
      eyebrow: "Memberships",
      title: "Membership plans",
      description: "Create and manage the plans members can use to access your community.",
    };
  }

  return {
    eyebrow: "Payments",
    title: "Payment setup",
    description: "Connect Stripe and review the setup steps needed for native hub payments.",
  };
}

function PaymentWorkspaceLoadingBody({ selectedView }) {
  if (selectedView === "payments") {
    return <AdminPaymentRecordsFallback />;
  }

  if (selectedView === "plans") {
    return <AdminMembershipPlansFallback />;
  }

  return <AdminPaymentSetupFallback />;
}

export default async function PaymentsLoading() {
  const headerStore = await headers();
  const selectedView = getSelectedView(headerStore.get("x-hubforj-search"));

  return (
    <div className={styles.layout} role="status" aria-live="polite" aria-label="Loading payment workspace">
      <PageHeader {...getPaymentsHeaderCopy(selectedView)} />
      <PaymentWorkspaceLoadingBody selectedView={selectedView} />
    </div>
  );
}
