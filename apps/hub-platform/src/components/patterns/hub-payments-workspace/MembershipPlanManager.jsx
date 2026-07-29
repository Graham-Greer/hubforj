"use client";

import { useActionState, useState } from "react";
import { initialDeleteMembershipPlanActionState, initialMembershipPlanActionState } from "@/app/(admin)/[hubSlug]/admin/payments/form-state";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import PackageUpgradeNotice from "@/components/patterns/package-upgrade-notice/PackageUpgradeNotice";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import FormMessage from "@/components/ui/form-message/FormMessage";
import Icon from "@/components/ui/icon/Icon";
import Input from "@/components/ui/input/Input";
import Modal from "@/components/ui/modal/Modal";
import Surface from "@/components/primitives/surface/Surface";
import SubmitButton from "@/components/ui/submit-button/SubmitButton";
import Textarea from "@/components/ui/textarea/Textarea";
import WorkspaceSection from "@/components/patterns/workspace-section/WorkspaceSection";
import {
  getHubCurrencySelectOptions,
  resolveHubCurrencyValue,
} from "@/lib/domain/currency-options";
import { formatMembershipDate } from "@/lib/domain/memberships";
import {
  durationUnitOptions,
  getMembershipPlanValues,
  membershipPlanStatusOptions,
  membershipPlanVisibilityOptions,
  pricingModeOptions,
} from "./hub-payments-helpers";
import styles from "./HubPaymentsWorkspace.module.css";

function MembershipPlanFields({
  hub,
  values,
  mode = "edit",
  canUsePaidPlans = false,
  paymentProcessingMode = "none",
  isDefaultPlan = false,
  nativePaymentsBlocked = false,
}) {
  const isCreate = mode === "create";
  const isLockedPaidPlan = (!canUsePaidPlans || nativePaymentsBlocked) && !isCreate && values.pricingMode === "paid";
  const isStripeSetupBlockingPaidPlan = nativePaymentsBlocked && values.pricingMode === "paid";
  const isExternalPayments = paymentProcessingMode === "external";
  const currencyValue = resolveHubCurrencyValue(hub, values.currency);
  const currencyOptions = getHubCurrencySelectOptions(hub, values.currency);
  const initialPricingMode =
    isLockedPaidPlan
      ? "paid"
      : (canUsePaidPlans && !nativePaymentsBlocked) || values.pricingMode === "free"
        ? values.pricingMode
        : "free";
  const [pricingMode, setPricingMode] = useState(initialPricingMode);
  const pricingOptions = canUsePaidPlans && !nativePaymentsBlocked
    ? pricingModeOptions
    : pricingModeOptions.filter((option) => (isLockedPaidPlan ? option.value === "paid" : option.value === "free"));

  return (
    <div className={styles.planGrid}>
      <Input
        name="title"
        label="Plan title"
        defaultValue={values.title}
        placeholder={isCreate ? "Standard membership" : undefined}
        requiredIndicator
      />
      {isDefaultPlan ? (
        <>
          <Input
            name="pricingMode_display"
            label="Pricing model"
            defaultValue="Free baseline"
            disabled
            hint="The default plan stays free so every new member starts on the community baseline before choosing any upgrade."
          />
          <input type="hidden" name="pricingMode" value={values.pricingMode} />
        </>
      ) : (
        <>
          <AdminSelect
            name="pricingMode"
            label="Pricing model"
            defaultValue={initialPricingMode}
            options={pricingOptions}
            requiredIndicator
            onChange={isLockedPaidPlan ? undefined : (event) => setPricingMode(event.target.value)}
            disabled={isLockedPaidPlan}
            hint={
              isStripeSetupBlockingPaidPlan
                ? "This plan stays paid, but Stripe setup must be completed before built-in membership payments can run on Growth."
                : nativePaymentsBlocked
                  ? "Finish Stripe setup in Payments before switching this plan to paid on Growth."
                  : isLockedPaidPlan
                    ? "This plan stays paid, but pricing is locked until the hub is back on Starter or above."
                    : undefined
            }
          />
          {isLockedPaidPlan ? <input type="hidden" name="pricingMode" value="paid" /> : null}
        </>
      )}
      {pricingMode === "paid" ? (
        <>
            <Input
              name={isLockedPaidPlan ? "price_display" : "price"}
              label="Price"
              defaultValue={values.price}
              placeholder={isCreate ? "25" : undefined}
              requiredIndicator
              disabled={isLockedPaidPlan}
              hint={
                isStripeSetupBlockingPaidPlan
                  ? "Finish Stripe setup before changing paid membership pricing on Growth."
                  : isLockedPaidPlan
                    ? "Upgrade to Starter to change paid membership pricing."
                    : undefined
              }
            />
          <AdminSelect
            name={isLockedPaidPlan ? "currency_display" : "currency"}
            label="Currency"
            defaultValue={currencyValue}
            options={currencyOptions}
            disabled={isLockedPaidPlan}
            hint={
              isStripeSetupBlockingPaidPlan
                ? "Paid-plan currency is preserved until Stripe setup is complete."
                : isLockedPaidPlan
                  ? "Paid-plan currency is preserved while this hub is below Starter."
                  : "Defaults to your hub regional settings."
            }
          />
          {isLockedPaidPlan ? <input type="hidden" name="price" value={values.price} /> : null}
          {isLockedPaidPlan ? <input type="hidden" name="currency" value={currencyValue} /> : null}
          {isExternalPayments && !isLockedPaidPlan ? (
            <>
              <Input
                name="externalPaymentUrl"
                label="External payment link"
                type="url"
                defaultValue={values.externalPaymentUrl}
                placeholder="https://payments.example.com/membership"
                hint="Optional if you are collecting payment by bank transfer or manual reference instead. Use a checkout link, payment instructions, or both."
                className={styles.planDescription}
              />
              <Textarea
                className={styles.planDescription}
                name="paymentInstructions"
                label="Payment instructions"
                defaultValue={values.paymentInstructions}
                placeholder="Explain how to pay, for example with bank transfer details, a payment reference, or what happens after checkout."
                hint="Required only if you do not provide an external payment link. Members can use a checkout link, payment instructions, or both."
                rows={3}
              />
            </>
          ) : null}
        </>
      ) : null}
      {isDefaultPlan ? (
        <>
          <Input
            name="durationUnit_display"
            label="Duration unit"
            defaultValue={values.durationUnit}
            disabled
            hint="The default plan keeps its current baseline duration for now."
          />
          <input type="hidden" name="durationUnit" value={values.durationUnit} />
          <Input
            name="durationValue_display"
            type="number"
            min="1"
            label="Duration value"
            defaultValue={values.durationValue}
            disabled
          />
          <input type="hidden" name="durationValue" value={values.durationValue} />
        </>
      ) : (
        <>
          <AdminSelect
            name="durationUnit"
            label="Duration unit"
            defaultValue={values.durationUnit}
            options={durationUnitOptions}
            requiredIndicator
          />
          <Input
            name="durationValue"
            type="number"
            min="1"
            label="Duration value"
            defaultValue={values.durationValue}
            requiredIndicator
          />
        </>
      )}
      {isDefaultPlan ? (
        <>
          <Input
            name="visibility_display"
            label="Plan visibility"
            defaultValue="Public baseline"
            disabled
            hint="The default membership plan stays public as the baseline membership assigned during join."
          />
          <input type="hidden" name="visibility" value="public" />
        </>
      ) : (
        <AdminSelect
          name="visibility"
          label="Plan visibility"
          defaultValue={values.visibility}
          options={membershipPlanVisibilityOptions}
          requiredIndicator
          hint="Public plans appear to members as upgrade options. Private plans stay admin-assigned only."
        />
      )}
      {isDefaultPlan ? (
        <>
          <Input
            name="status_display"
            label="Status"
            defaultValue="Active baseline"
            disabled
            hint="The default membership plan stays active because it is assigned automatically when someone joins."
          />
          <input type="hidden" name="status" value={values.status} />
        </>
      ) : (
        <AdminSelect
          name="status"
          label="Status"
          defaultValue={values.status}
          options={membershipPlanStatusOptions}
          requiredIndicator
        />
      )}
      <Textarea
        className={styles.planDescription}
        name="description"
        label="Description"
        defaultValue={values.description}
        placeholder={isCreate ? "Who this plan is for and what it includes." : undefined}
        rows={4}
      />
    </div>
  );
}

function MembershipPlanEditor({
  hub,
  plan,
  updateMembershipPlanAction,
  onDelete,
  canUsePaidPlans,
  paymentProcessingMode,
  nativePaymentsBlocked = false,
}) {
  const seededState = {
    ...initialMembershipPlanActionState,
    values: getMembershipPlanValues(plan, hub.defaultCurrency || "USD"),
  };
  const [state, formAction] = useActionState(updateMembershipPlanAction, seededState);
  const values = {
    ...seededState.values,
    ...(state?.values || {}),
  };
  const isLockedPaidPlan = !canUsePaidPlans && values.pricingMode === "paid";

  return (
    <div className={styles.planAccordionContent}>
      <div className={styles.planIntroStack}>
        {plan.isDefault ? (
          <div className={styles.planUpgradePanel}>
            <p className={styles.detail}>
              This default free plan is assigned automatically when someone joins your community. Additional plans should be treated as optional upgrades.
            </p>
            <p className={styles.detail}>Only the title and description can be edited for the default plan.</p>
          </div>
        ) : (
          <div className={styles.planUpgradePanel}>
            <p className={styles.detail}>
              Members can move onto this plan after joining when your community wants to offer a higher tier membership option.
            </p>
          </div>
        )}
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
        {!canUsePaidPlans ? (
          <div className={styles.planUpgradePanel}>
            <PackageUpgradeNotice
              title={isLockedPaidPlan ? "This paid plan is protected on your current package" : "Paid membership plans start on Starter"}
              description={
                isLockedPaidPlan
                  ? "This plan remains paid and its pricing is preserved. Upgrade to Starter to manage paid membership pricing again, or to Growth for built-in payments."
                  : "You can still manage this plan as a free membership. Upgrade to Starter when you are ready to charge for memberships."
              }
              currentUsage={0}
              limit={0}
              unlocks={[
                isLockedPaidPlan ? "Edit paid membership pricing" : "Create paid membership plans",
                "Collect payments through an external checkout link",
                "Upgrade to Growth later for built-in payment handling",
              ]}
            />
          </div>
        ) : nativePaymentsBlocked ? (
          <div className={styles.planUpgradePanel}>
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for memberships"
          description="You can keep shaping free membership plans now. Complete Stripe setup first, then return here to create or manage paid Growth membership plans."
          unlocks={[]}
        />
          </div>
        ) : null}
      </div>
      <div className={styles.planFormSection}>
        <form action={formAction} className={styles.planForm}>
          <input type="hidden" name="hubSlug" value={hub.slug} />
          <input type="hidden" name="planId" value={plan.id} />
          <MembershipPlanFields
            key={`${plan.id}:${values.pricingMode}:${values.visibility}:${paymentProcessingMode}`}
            hub={hub}
            values={values}
            canUsePaidPlans={canUsePaidPlans}
            paymentProcessingMode={paymentProcessingMode}
            isDefaultPlan={plan.isDefault}
            nativePaymentsBlocked={nativePaymentsBlocked}
          />
          <div className={styles.planMeta}>
            {!plan.isDefault ? (
              <div className={styles.planSecondaryAction}>
                <Button type="button" variant="secondary" className={styles.deletePlanButton} onClick={() => onDelete(plan)}>
                  Delete plan
                </Button>
              </div>
            ) : null}
            <div className={styles.planActions}>
              <SubmitButton idleLabel="Save plan" pendingLabel="Saving plan" variant="primary" />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateMembershipPlanForm({
  hub,
  createMembershipPlanAction,
  onCancel,
  canUsePaidPlans,
  paymentProcessingMode,
  nativePaymentsBlocked = false,
}) {
  const seededState = {
    ...initialMembershipPlanActionState,
    values: {
      ...initialMembershipPlanActionState.values,
      currency: hub.defaultCurrency || initialMembershipPlanActionState.values.currency || "USD",
    },
  };
  const [state, formAction] = useActionState(createMembershipPlanAction, seededState);
  const values = {
    ...seededState.values,
    ...(state?.values || {}),
    pricingMode:
      canUsePaidPlans || (state?.values?.pricingMode || initialMembershipPlanActionState.values.pricingMode) === "free"
        ? (state?.values?.pricingMode || initialMembershipPlanActionState.values.pricingMode)
        : "free",
  };

  return (
    <WorkspaceSection
      eyebrow="New plan"
      title="Create membership plan"
      description="Set the pricing and renewal cadence, then return to the plan list when you are done."
    >
      {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
      {!canUsePaidPlans ? (
        <PackageUpgradeNotice
          title="Paid membership plans start on Starter"
          description="You can create and manage free membership plans here. Upgrade to Starter when you are ready to charge for memberships."
          currentUsage={0}
          limit={0}
          unlocks={[
            "Create paid membership plans",
            "Collect payments through an external checkout link",
            "Upgrade to Growth later for built-in payments",
          ]}
        />
      ) : nativePaymentsBlocked ? (
        <PackageUpgradeNotice
          title="Finish Stripe setup before charging for memberships"
          description="You can create free plans now. Complete Stripe setup first, then return here when you want paid Growth membership plans."
          unlocks={[]}
        />
      ) : null}
      <form action={formAction} className={styles.planForm}>
        <input type="hidden" name="hubSlug" value={hub.slug} />
        <MembershipPlanFields
          key={`create:${values.pricingMode}:${values.visibility}:${paymentProcessingMode}:${canUsePaidPlans ? "paid" : "free"}`}
          hub={hub}
          values={values}
          mode="create"
          canUsePaidPlans={canUsePaidPlans}
          paymentProcessingMode={paymentProcessingMode}
          nativePaymentsBlocked={nativePaymentsBlocked}
        />
        <div className={styles.planMeta}>
          <div className={styles.planSecondaryAction}>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          </div>
          <div className={styles.planActions}>
            <SubmitButton idleLabel="Create membership plan" pendingLabel="Creating plan" variant="primary" />
          </div>
        </div>
      </form>
    </WorkspaceSection>
  );
}

function DeleteMembershipPlanModal({ hub, plan, deleteMembershipPlanAction, onClose }) {
  const formId = `delete-membership-plan-${plan.id}`;
  const [state, formAction] = useActionState(deleteMembershipPlanAction, initialDeleteMembershipPlanActionState);

  return (
    <Modal
      title="Delete membership plan"
      onClose={onClose}
      actions={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <SubmitButton
            form={formId}
            idleLabel="Delete plan"
            pendingLabel="Deleting plan"
            variant="secondary"
            className={styles.deletePlanButton}
          />
        </>
      }
    >
      <div className={styles.deleteModalBody}>
        <p className={styles.detail}>
          Delete <strong>{plan.title}</strong>? This is destructive and cannot be undone.
        </p>
        <p className={styles.detail}>
          If the plan is still assigned to members, deletion will be blocked until those memberships are reassigned.
        </p>
        <p className={styles.deleteWarning}>
          Type <strong>{plan.title}</strong> to confirm that this membership plan should be removed.
        </p>
        {state?.error ? <FormMessage tone="danger">{state.error}</FormMessage> : null}
        <form id={formId} action={formAction} className={styles.deleteForm}>
          <input type="hidden" name="hubSlug" value={hub.slug} />
          <input type="hidden" name="planId" value={plan.id} />
          <input type="hidden" name="expectedTitle" value={plan.title} />
          <Input
            name="confirmation"
            label="Confirmation"
            placeholder={plan.title}
            autoComplete="off"
            defaultValue={state?.confirmation || ""}
          />
        </form>
      </div>
    </Modal>
  );
}

function PendingUpgradeRequestsPanel({ hub, requests = [], approveMembershipUpgradeRequestAction = null }) {
  if (!requests.length) {
    return null;
  }

  return (
    <div className={styles.planUpgradePanel}>
      <div className={styles.planIntroStack}>
        <p className={styles.detail}>
          <strong>Pending upgrade requests.</strong> Review member-initiated upgrade requests here so paid external upgrades do not get stuck waiting in individual member records.
        </p>
        <div className={styles.planList}>
          {requests.map((request) => (
            <Surface key={request.id} tone="muted" padding="md" className={styles.upgradeRequestCard}>
              <div className={styles.upgradeRequestHeader}>
                <div className={styles.planIntroStack}>
                  <p className={styles.primaryValue}>{request.userName || "Member"}</p>
                  <p className={styles.detail}>{request.userEmail || "No email recorded"}</p>
                </div>
                <div className={styles.planAccordionTitleWrap}>
                  <Badge tone="warning">Pending</Badge>
                  {request.paymentProcessingMode === "external" ? <Badge tone="warning">External payment</Badge> : null}
                </div>
              </div>

              <div className={styles.planSummaryStack}>
                <p className={styles.detail}>
                  <strong>Requested plan:</strong> {request.planTitle || "Membership plan"}
                </p>
                <p className={styles.detail}>
                  <strong>Requested at:</strong> {formatMembershipDate(request.requestedAt, hub?.locale)}
                </p>
                <p className={styles.detail}>
                  <strong>Current plan:</strong> {request.currentPlanTitle || "Membership"}
                </p>
              </div>

              <div className={styles.planActions}>
                <Button href={`/${hub.slug}/admin/members/${request.userId}`} variant="ghost">
                  Open member
                </Button>
                {approveMembershipUpgradeRequestAction ? (
                  <form action={approveMembershipUpgradeRequestAction}>
                    <input type="hidden" name="hubSlug" value={hub.slug} />
                    <input type="hidden" name="memberId" value={request.userId} />
                    <input type="hidden" name="requestId" value={request.id} />
                    <input type="hidden" name="paymentStatus" value="paid" />
                    <Button type="submit" variant="secondary">Approve request</Button>
                  </form>
                ) : null}
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MembershipPlanManager({
  hub,
  membershipPlans,
  pendingUpgradeRequests = [],
  paymentSetupState = null,
  openPlanId,
  setOpenPlanId,
  planDeleteTarget,
  setPlanDeleteTarget,
  createFormRef,
  openCreatePlan,
  createMembershipPlanAction,
  updateMembershipPlanAction,
  deleteMembershipPlanAction,
  approveMembershipUpgradeRequestAction = null,
}) {
  const canUsePaidPlans = hub?.packageCapabilities?.paidMembershipsEnabled === true;
  const paymentProcessingMode = hub?.packagePaymentProcessingMode || "none";
  const nativePaymentsBlocked = paymentProcessingMode === "internal" && paymentSetupState?.key !== "ready";

  return (
    <>
      <PageHeader
        eyebrow="Membership plans"
        title="Manage membership plans"
        description="Manage your community's default plan and create membership upgrade options to suit your needs."
        actions={
          <Button type="button" onClick={openCreatePlan} data-onboarding="membership-plans-create-button">
            Create membership plan
          </Button>
        }
      />
      <div className={styles.planSection} data-onboarding="membership-plans-section">
        <PendingUpgradeRequestsPanel
          hub={hub}
          requests={pendingUpgradeRequests}
          approveMembershipUpgradeRequestAction={approveMembershipUpgradeRequestAction}
        />
        {membershipPlans.length ? (
          <div className={styles.planList} data-onboarding="membership-plans-list">
            {membershipPlans.map((plan) => {
              const isOpen = openPlanId === plan.id;

              return (
                <Surface key={plan.id} as="article" tone="default" padding="none" className={styles.planAccordionItem}>
                  <button
                    type="button"
                    className={styles.planAccordionHeader}
                    aria-expanded={isOpen}
                    onClick={() => setOpenPlanId((current) => (current === plan.id ? null : plan.id))}
                    >
                      <span className={styles.planAccordionTitleWrap}>
                        <span className={styles.planAccordionTitle}>{plan.title}</span>
                      {plan.isDefault ? <Badge tone="neutral">Default plan</Badge> : <Badge tone="neutral">Upgrade plan</Badge>}
                      <Badge tone={plan.visibility === "private" ? "warning" : "accent"}>
                        {plan.isDefault ? "Public baseline" : plan.visibility === "private" ? "Private" : "Public"}
                      </Badge>
                      <Badge tone={plan.status === "active" ? "success" : plan.status === "inactive" ? "warning" : "danger"}>
                        {plan.status || "active"}
                      </Badge>
                    </span>
                    <span className={styles.planAccordionIcons} aria-hidden="true">
                      <Icon name="edit" size="sm" />
                      <Icon name={isOpen ? "expand_less" : "expand_more"} size="sm" />
                    </span>
                  </button>

                  {isOpen ? (
                    <MembershipPlanEditor
                      hub={hub}
                      plan={plan}
                      updateMembershipPlanAction={updateMembershipPlanAction}
                      onDelete={setPlanDeleteTarget}
                      canUsePaidPlans={canUsePaidPlans}
                      paymentProcessingMode={paymentProcessingMode}
                      nativePaymentsBlocked={nativePaymentsBlocked}
                    />
                  ) : null}
                </Surface>
              );
            })}
          </div>
        ) : (
          <div data-onboarding="membership-plans-list">
            <EmptyState
              eyebrow="No plans yet"
              title="Create the first membership plan"
              description="Create a plan first so you can start assigning memberships to members."
            />
          </div>
        )}

        <div ref={createFormRef}>
          {openPlanId === "__create__" ? (
            <CreateMembershipPlanForm
              hub={hub}
              createMembershipPlanAction={createMembershipPlanAction}
              onCancel={() => setOpenPlanId(null)}
              canUsePaidPlans={canUsePaidPlans}
              paymentProcessingMode={paymentProcessingMode}
              nativePaymentsBlocked={nativePaymentsBlocked}
            />
          ) : null}
        </div>
      </div>

      {planDeleteTarget ? (
        <DeleteMembershipPlanModal
          key={planDeleteTarget.id}
          hub={hub}
          plan={planDeleteTarget}
          deleteMembershipPlanAction={deleteMembershipPlanAction}
          onClose={() => setPlanDeleteTarget(null)}
        />
      ) : null}
    </>
  );
}
