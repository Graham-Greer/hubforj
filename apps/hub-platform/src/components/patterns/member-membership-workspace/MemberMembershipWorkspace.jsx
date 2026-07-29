import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import EmptyState from "@/components/patterns/empty-state/EmptyState";
import FormMessage from "@/components/ui/form-message/FormMessage";
import PageHeader from "@/components/patterns/page-header/PageHeader";
import Surface from "@/components/primitives/surface/Surface";
import { buildHubRuntimeHref } from "@/lib/domain/hub-runtime-paths";
import {
  cancelMembershipUpgradeRequestAction,
  requestMembershipUpgradeAction,
} from "@/app/(hub)/[hubSlug]/account/membership/actions";
import {
  buildMembershipUpgradeCta,
  formatMembershipPlanCadence,
  formatMembershipDate,
  formatMoney,
  getAvailableMembershipUpgradePlans,
  getMembershipPaymentStatusLabel,
  getMembershipPaymentStatusTone,
  getMembershipStatusLabel,
  getMembershipStatusTone,
  resolveMembershipPlanPricingMode,
} from "@/lib/domain/memberships";
import ReturnToDefaultMembershipPanel from "./ReturnToDefaultMembershipPanel";
import styles from "./MemberMembershipWorkspace.module.css";

function DetailRow({ label, value }) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>{label}</dt>
      <dd className={styles.detailValue}>{value}</dd>
    </div>
  );
}

function formatPlanPrice(plan, hub) {
  const pricingMode = resolveMembershipPlanPricingMode(plan);

  if (pricingMode === "free") {
    return "Free";
  }

  if (plan?.price) {
    return formatMoney(plan.price, plan.currency, hub.locale);
  }

  return "Contact hub";
}

function UpgradePlanCard({ hub, plan, paymentProcessingMode }) {
  const routeMode = hub?.routeMode || "path";
  const cta = buildMembershipUpgradeCta({
    hubSlug: hub.slug,
    plan,
    paymentProcessingMode,
    routeMode,
  });
  const isSelfServeUpgrade =
    resolveMembershipPlanPricingMode(plan) === "paid"
    && (paymentProcessingMode === "external" || paymentProcessingMode === "internal");

  return (
    <article className={styles.upgradeCard}>
      <div className={styles.upgradeHeader}>
        <div className={styles.upgradeCopy}>
          <h3 className={styles.upgradeTitle}>{plan.title || "Membership plan"}</h3>
          <p className={styles.upgradeMeta}>
            {formatPlanPrice(plan, hub)} · {formatMembershipPlanCadence(plan)}
          </p>
        </div>
        <div className={styles.badges}>
          <Badge tone={resolveMembershipPlanPricingMode(plan) === "free" ? "neutral" : "accent"}>
            {resolveMembershipPlanPricingMode(plan) === "free" ? "Free plan" : "Paid plan"}
          </Badge>
          {paymentProcessingMode === "external" && resolveMembershipPlanPricingMode(plan) === "paid" ? (
            <Badge tone="warning">External payment</Badge>
          ) : null}
        </div>
      </div>

      {plan.description ? <p className={styles.upgradeDescription}>{plan.description}</p> : null}
      <p className={styles.upgradeSupport}>{cta.supportingText}</p>

      <div className={styles.upgradeActions}>
        {isSelfServeUpgrade ? (
          <form action={requestMembershipUpgradeAction}>
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <input type="hidden" name="planId" value={plan.id} />
            <Button type="submit" variant="secondary">Start upgrade</Button>
          </form>
        ) : (
          <Button
            href={cta.href}
            variant="secondary"
            target={cta.external ? "_blank" : undefined}
            rel={cta.external ? "noreferrer" : undefined}
          >
            {cta.label}
          </Button>
        )}
      </div>
    </article>
  );
}

function PendingUpgradeRequestCard({ hub, upgradeRequest, upgradeTransaction = null }) {
  const routeMode = hub?.routeMode || "path";
  const showExternalPayment =
    upgradeRequest.paymentProcessingMode === "external" &&
    upgradeRequest.pricingMode === "paid" &&
    upgradeRequest.externalPaymentUrl;
  const showNativePayment =
    upgradeRequest.paymentProcessingMode === "internal" &&
    upgradeRequest.pricingMode === "paid";
  const nativePaymentStatus = upgradeTransaction?.status || upgradeRequest.nativePaymentStatus;
  const nativePaymentCompleted =
    nativePaymentStatus === "payment_received" ||
    nativePaymentStatus === "checkout_completed";
  const nativePaymentNeedsRestart =
    nativePaymentStatus === "payment_failed" ||
    nativePaymentStatus === "checkout_cancelled";
  const canContinueNativeCheckout =
    showNativePayment &&
    upgradeRequest.nativePaymentCheckoutUrl &&
    nativePaymentStatus === "checkout_open";

  return (
    <Surface className={styles.card}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionCopy}>
          <h2 className={styles.sectionTitle}>{`Upgrade to ${upgradeRequest.planTitle || "your next plan"} in progress`}</h2>
          <p className={styles.sectionDescription}>
            {showNativePayment
              ? nativePaymentCompleted
                ? "Your payment step is complete. We are finalising the membership change now, and your current membership stays active until that update is applied."
                : nativePaymentNeedsRestart
                  ? "The Stripe checkout did not complete. Cancel this request and start the upgrade again when you are ready. Until then, your current membership stays active."
                  : "Complete the Stripe checkout below to start this upgrade. Until then, your current membership stays active."
              : "Complete the next step below, then wait for the hub team to confirm the membership change. Until then, your current membership stays active."}
          </p>
        </div>
      </div>

      <div className={styles.badges}>
        <Badge tone={showNativePayment && upgradeTransaction ? upgradeTransaction.statusTone : "warning"}>
          {showNativePayment && upgradeTransaction ? upgradeTransaction.statusLabel : "Pending confirmation"}
        </Badge>
        {showExternalPayment ? <Badge tone="warning">External payment</Badge> : null}
        {showNativePayment ? <Badge tone="accent">Stripe checkout</Badge> : null}
      </div>

      <dl className={styles.details}>
        <DetailRow label="Requested plan" value={upgradeRequest.planTitle || "Membership plan"} />
        <DetailRow label="Requested" value={formatMembershipDate(upgradeRequest.requestedAt, hub.locale)} />
        <DetailRow
          label="Price"
          value={
            upgradeRequest.pricingMode === "free"
              ? "Free"
              : upgradeRequest.price
                ? formatMoney(upgradeRequest.price, upgradeRequest.currency, hub.locale)
                : "Contact hub"
          }
        />
      </dl>

      {upgradeRequest.paymentInstructions ? <p className={styles.notes}>{upgradeRequest.paymentInstructions}</p> : null}

      <div className={styles.sectionActions}>
        {showExternalPayment ? (
          <Button
            href={upgradeRequest.externalPaymentUrl}
            variant="secondary"
            target="_blank"
            rel="noreferrer"
          >
            Continue to payment
          </Button>
        ) : canContinueNativeCheckout ? (
          <Button href={upgradeRequest.nativePaymentCheckoutUrl} variant="secondary">Continue checkout</Button>
        ) : showNativePayment && nativePaymentCompleted ? (
          <Button href={buildHubRuntimeHref(hub.slug, "/account/billing", routeMode)} variant="secondary">Open billing</Button>
        ) : (
          <Button href={`${buildHubRuntimeHref(hub.slug, "/", routeMode)}#footer-contact`} variant="secondary">Contact the hub</Button>
        )}
        {!nativePaymentCompleted ? (
          <form action={cancelMembershipUpgradeRequestAction}>
            <input type="hidden" name="hubSlug" value={hub.slug} />
            <Button type="submit" variant="ghost">Cancel upgrade</Button>
          </form>
        ) : null}
      </div>
    </Surface>
  );
}

export default function MemberMembershipWorkspace({
  hub,
  membership,
  membershipPlans = [],
  upgradeRequest = null,
  upgradeTransaction = null,
  successMessage = "",
  errorMessage = "",
}) {
  const routeMode = hub?.routeMode || "path";
  const paymentProcessingMode = hub.packagePaymentProcessingMode || "none";
  const upgradePlans = getAvailableMembershipUpgradePlans(membershipPlans, membership);
  const showReturnToDefaultAction =
    membership &&
    membership.isDefault !== true &&
    !upgradeRequest;
  const hasScheduledDefaultReturn =
    membership?.scheduledChangeStatus === "pending" &&
    membership?.scheduledChangeType === "default_plan_downgrade";
  const showAvailableUpgradesPanel =
    Boolean(upgradeRequest) ||
    upgradePlans.length > 0 ||
    membership?.isDefault === true;

  if (!membership) {
    return (
      <EmptyState
        eyebrow="Membership"
        title="Membership not set up yet"
        description="Your account is active, but no membership record has been assigned yet. Contact the hub if you expected a membership plan or renewal schedule to appear here."
        primaryAction={{ href: `${buildHubRuntimeHref(hub.slug, "/", routeMode)}#footer-contact`, label: "Contact the hub" }}
        secondaryAction={{ href: buildHubRuntimeHref(hub.slug, "/account", routeMode), label: "Back to account" }}
      />
    );
  }

  return (
    <div className={styles.root}>
      {errorMessage ? <FormMessage tone="danger">{decodeURIComponent(errorMessage)}</FormMessage> : null}
      {successMessage ? <FormMessage tone="success">{successMessage}</FormMessage> : null}
      <PageHeader
        eyebrow="Member account"
        title="Membership"
        description="Check your current plan, confirm renewal timing, and see whether this hub offers any public upgrade plans."
      />

      {upgradeRequest ? (
        <PendingUpgradeRequestCard
          hub={hub}
          upgradeRequest={upgradeRequest}
          upgradeTransaction={upgradeTransaction}
        />
      ) : null}

      <Surface className={styles.card}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionCopy}>
            <h2 className={styles.sectionTitle}>{membership.planTitle || `${hub.name} membership`}</h2>
            <p className={styles.sectionDescription}>
              {upgradeRequest
                ? "Your current membership stays active until the hub confirms your upgrade."
                : "Your current membership details and renewal timing."}
            </p>
          </div>
          <div className={styles.sectionActions}>
            <Button href={buildHubRuntimeHref(hub.slug, "/account/billing", routeMode)} variant="secondary">View billing</Button>
          </div>
        </div>

        <div className={styles.badges}>
          <Badge tone="neutral">
            {membership.isDefault ? "Default plan" : "Upgrade plan"}
          </Badge>
          <Badge tone={getMembershipStatusTone(membership.derivedStatus)}>
            {getMembershipStatusLabel(membership.derivedStatus)}
          </Badge>
          <Badge tone={getMembershipPaymentStatusTone(membership.paymentStatus)}>
            {getMembershipPaymentStatusLabel(membership.paymentStatus)}
          </Badge>
          {hasScheduledDefaultReturn ? <Badge tone="warning">Default plan scheduled</Badge> : null}
        </div>

        <dl className={[styles.details, styles.currentMembershipDetails].join(" ")}>
          <DetailRow label="Started" value={formatMembershipDate(membership.startDate, hub.locale)} />
          <DetailRow label="Renewal date" value={formatMembershipDate(membership.renewalDate, hub.locale)} />
          <DetailRow
            label="Price"
            value={
              membership.pricingMode === "free"
                ? "Free"
                : membership.planPrice
                  ? formatMoney(membership.planPrice, membership.planCurrency, hub.locale)
                  : "Contact hub"
            }
          />
        </dl>

        {showReturnToDefaultAction ? (
          <ReturnToDefaultMembershipPanel
            hubSlug={hub.slug}
            currentPlanTitle={membership.planTitle || `${hub.name} membership`}
            scheduledPlanTitle={membership.scheduledPlanTitle || "default membership"}
            scheduledChangeAt={membership.scheduledChangeAt || membership.renewalDate}
            locale={hub.locale}
            hasScheduledDefaultReturn={hasScheduledDefaultReturn}
            canScheduleDefaultReturn={Boolean(membership.renewalDate)}
          />
        ) : null}

        {membership.planDescription ? <p className={styles.notes}>{membership.planDescription}</p> : null}
      </Surface>

      {showAvailableUpgradesPanel ? (
        <Surface className={styles.card}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionCopy}>
              <h2 className={styles.sectionTitle}>Available upgrades</h2>
              <p className={styles.sectionDescription}>
                If this hub offers any other membership plans you can move to, they will appear here.
              </p>
            </div>
          </div>

          {upgradeRequest ? (
            <p className={styles.notes}>
              Finish the current upgrade request before starting another plan change.
            </p>
          ) : upgradePlans.length ? (
            <div className={styles.upgradeGrid}>
              {upgradePlans.map((plan) => (
                <UpgradePlanCard
                  key={plan.id}
                  hub={hub}
                  plan={plan}
                  paymentProcessingMode={paymentProcessingMode}
                />
              ))}
            </div>
          ) : (
            <p className={styles.notes}>
              There are no other membership plans available right now. If you need something different, please contact the hub team.
            </p>
          )}
        </Surface>
      ) : null}
    </div>
  );
}
