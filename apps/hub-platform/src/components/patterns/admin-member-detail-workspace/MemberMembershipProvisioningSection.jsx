"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import AdminFormFooter from "@/components/patterns/admin-form-footer/AdminFormFooter";
import Button from "@/components/ui/button/Button";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import Input from "@/components/ui/input/Input";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import useDirtyFormState from "@/hooks/use-dirty-form-state";
import {
  createFormSnapshotFromKeys,
  createSavedSnapshotFromKeys,
} from "@/lib/forms/admin-form-snapshots";
import styles from "./AdminMemberDetailWorkspace.module.css";

const membershipStatusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const paymentStatusOptions = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "overdue", label: "Overdue" },
  { value: "failed", label: "Failed" },
  { value: "not_required", label: "Free" },
];

function toDateTimeLocalValue(value) {
  return value ? String(value).slice(0, 16) : "";
}

function buildInitialValues(detail, membershipPlans) {
  return {
    planId: detail.membership?.planId || membershipPlans[0]?.id || "",
    status: detail.membership?.status || "active",
    paymentStatus: detail.membership?.paymentStatus || "unpaid",
    startDate: toDateTimeLocalValue(detail.membership?.startDate),
    renewalDate: toDateTimeLocalValue(detail.membership?.renewalDate),
    notes: detail.membership?.notes || "",
  };
}

const fieldKeys = ["planId", "status", "paymentStatus", "startDate", "renewalDate", "notes"];

function createSavedValuesSnapshot(values, initialValues) {
  return createSavedSnapshotFromKeys(fieldKeys, initialValues, values);
}

function createFormSnapshot(form) {
  return createFormSnapshotFromKeys(form, fieldKeys);
}

export default function MemberMembershipProvisioningSection({
  hub,
  detail,
  membershipPlans = [],
  membershipAction = null,
  membersQuery = "",
  embedded = false,
}) {
  const initialValues = buildInitialValues(detail, membershipPlans);
  const initialState = {
    error: "",
    values: initialValues,
  };
  const [state, formAction] = useActionState(membershipAction, initialState);
  const feedbackRef = useRef(null);
  const values = {
    ...initialValues,
    ...(state?.values || {}),
  };
  const [selectedPlanId, setSelectedPlanId] = useState(initialValues.planId);
  const { formRef, isDirty, updateDirtyState } = useDirtyFormState({
    initialSnapshot: createSavedValuesSnapshot(initialValues, initialValues),
    createFormSnapshot,
  });

  useEffect(() => {
    if (!feedbackRef.current || !state?.error) {
      return;
    }

    feedbackRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [state?.error]);

  const selectedPlan = membershipPlans.find((plan) => plan.id === selectedPlanId) || null;
  const membershipStatusOptionsForSelection =
    selectedPlan?.isDefault === true
      ? [{ value: "active", label: "Active" }]
      : membershipStatusOptions;
  const membershipStatusHint =
    selectedPlan?.isDefault === true
      ? "Default membership stays active. Suspend the member from the profile header if access should be blocked."
      : "";
  const membershipStatusValue =
    selectedPlan?.isDefault === true || values.status === "cancelled"
      ? "active"
      : values.status;
  const paymentStatusOptionsForSelection =
    selectedPlan?.isDefault === true
      ? [{ value: "not_required", label: "Free" }]
      : paymentStatusOptions;
  const paymentStatusValue =
    selectedPlan?.isDefault === true
      ? "not_required"
      : values.paymentStatus;
  const paymentStatusHint =
    selectedPlan?.isDefault === true
      ? "Free default membership does not require payment."
      : "Choose the payment state for this membership assignment.";

  const content = membershipPlans.length ? (
    <form
      ref={formRef}
      action={formAction}
      className={styles.membershipForm}
      onInput={updateDirtyState}
      onChange={updateDirtyState}
    >
      <input type="hidden" name="hubSlug" value={hub.slug} />
      <input type="hidden" name="memberId" value={detail.user.id} />
      <input type="hidden" name="membersQuery" value={membersQuery} />
      <div className={styles.membershipGrid}>
        <AdminSelect
          name="planId"
          label="Membership plan"
          hint="Choose the plan to assign to this member."
          defaultValue={values.planId}
          onChange={(event) => setSelectedPlanId(event.target.value)}
          options={membershipPlans.map((plan) => ({
            value: plan.id,
            label: `${plan.title || "Membership plan"}${plan.isDefault ? " (Default plan)" : " (Upgrade plan)"}`,
          }))}
        />
        <AdminSelect
          key={`membership-status:${selectedPlanId}:${membershipStatusValue}`}
          name="status"
          label="Membership status"
          hint={membershipStatusHint}
          defaultValue={membershipStatusValue}
          disabled={selectedPlan?.isDefault === true}
          options={membershipStatusOptionsForSelection}
        />
        <AdminSelect
          key={`membership-payment-status:${selectedPlanId}:${paymentStatusValue}`}
          name="paymentStatus"
          label="Payment status"
          defaultValue={paymentStatusValue}
          hint={paymentStatusHint}
          disabled={selectedPlan?.isDefault === true}
          options={paymentStatusOptionsForSelection}
        />
        <Input
          name="startDate"
          type="datetime-local"
          label="Start date"
          hint="Leave this as the current value unless you need to backdate or correct membership timing."
          defaultValue={values.startDate}
        />
        <Input
          name="renewalDate"
          type="datetime-local"
          label="Renewal date"
          hint="Leave blank to derive the next renewal from the selected plan duration."
          defaultValue={values.renewalDate}
        />
        <Input
          name="notes"
          label="Notes"
          hint="Optional internal note for this assignment."
          defaultValue={values.notes}
        />
      </div>
      <AdminFormFooter ref={feedbackRef} error={state?.error}>
        <Button type="submit" disabled={!isDirty}>
          {detail.membership ? "Update membership" : "Assign membership"}
        </Button>
      </AdminFormFooter>
    </form>
  ) : (
    <EmptyState
      eyebrow="No plans configured"
      title="Add membership plans before assigning one"
      description="Create a membership plan first, then return here to assign it to this member."
    />
  );

  if (embedded) {
    return content;
  }

  return (
    <WorkspaceSection
      eyebrow="Membership provisioning"
      title={detail.membership ? "Update membership assignment" : "Assign membership"}
      description="Assign a membership plan, update status, and adjust renewal details."
    >
      {content}
    </WorkspaceSection>
  );
}
