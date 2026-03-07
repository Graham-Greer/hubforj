"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Field from "@/components/ui/form/field/Field";
import Input from "@/components/ui/form/input/Input";
import Textarea from "@/components/ui/form/textarea/Textarea";
import Select from "@/components/ui/form/select/Select";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";
import useHydrated from "@/hooks/useHydrated";
import {
  appendPricingTier,
  reorderPricingTiers,
  removePricingTier,
  resolveActivePricingTierId,
  createDefaultPriceTierFeature,
} from "@/lib/cms/sections/pricing-section";
import styles from "./PricingTierEditor.module.css";

function restrictToVerticalAxis({ transform }) {
  return { ...transform, x: 0 };
}

function parseAmountMajorToMinor(value) {
  const normalized = String(value || "").trim();
  if (!normalized) return 0;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

function formatAmountMinorToMajor(amountMinor) {
  const amount = Number(amountMinor);
  if (!Number.isFinite(amount) || amount < 0) return "0.00";
  return (amount / 100).toFixed(2);
}

function TierRow({
  tier,
  index,
  selected,
  onSelect,
  onRequestRemove,
  title,
  status,
  dragDisabled = false,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: tier.id,
    disabled: dragDisabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        styles.tierRow,
        selected ? styles.tierRowSelected : "",
        isDragging ? styles.dragging : "",
        isOver ? styles.over : "",
      ].join(" ")}
    >
      <Button
        type="button"
        variant="tertiary"
        size="sm"
        icon="drag_indicator"
        ariaLabel={`Drag tier ${index + 1}`}
        disabled={dragDisabled}
        className={styles.dragHandle}
        {...(dragDisabled ? {} : { ...attributes, ...listeners })}
      />
      <button type="button" className={styles.selectButton} onClick={() => onSelect?.(tier.id)}>
        <span className={styles.selectTitle}>{title}</span>
        <span className={styles.selectMeta}>
          <Badge className={styles.statusBadge} size="sm" tone={status.tone}>
            {status.label}
          </Badge>
        </span>
      </button>
      <div className={styles.rowActions}>
        <Button
          type="button"
          variant="tertiary"
          size="sm"
          intent="danger"
          icon="delete"
          ariaLabel={`Remove tier ${index + 1}`}
          onClick={() => onRequestRemove?.(tier.id)}
        />
      </div>
    </li>
  );
}

export default function PricingTierEditor({
  items = [],
  onChange,
  onCreateItem,
  getItemTitle,
  getItemStatus,
  maxItems = 4,
  descriptionMaxLength = 200,
  intervalOptions = ["once", "month", "year"],
}) {
  const isHydrated = useHydrated();
  const [activeTierId, setActiveTierId] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState("");

  const resolvedActiveTierId = useMemo(
    () => resolveActivePricingTierId(items, activeTierId),
    [items, activeTierId]
  );

  const activeTierIndex = useMemo(
    () => items.findIndex((item) => item.id === resolvedActiveTierId),
    [items, resolvedActiveTierId]
  );
  const activeTier = activeTierIndex >= 0 ? items[activeTierIndex] : null;
  const pendingTier = items.find((item) => item.id === pendingRemoveId) || null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleAddTier() {
    const next = appendPricingTier(items, onCreateItem);
    onChange?.(next);
    setActiveTierId(resolveActivePricingTierId(next, ""));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = reorderPricingTiers(items, active.id, over.id);
    onChange?.(next);
  }

  function handleUpdateTier(patch) {
    if (activeTierIndex < 0) return;
    const next = [...items];
    next[activeTierIndex] = { ...next[activeTierIndex], ...patch };
    onChange?.(next);
  }

  function handleUpdateActiveTierCta(patch) {
    if (!activeTier) return;
    const cta = activeTier.cta && typeof activeTier.cta === "object" ? activeTier.cta : { label: "", href: "" };
    handleUpdateTier({ cta: { ...cta, ...patch } });
  }

  function handleToggleTierCta() {
    if (!activeTier) return;
    if (activeTier.cta) {
      handleUpdateTier({ cta: null });
      return;
    }
    handleUpdateTier({ cta: { label: "", href: "" } });
  }

  function handleToggleTierBadge() {
    if (!activeTier) return;
    if (activeTier.badge) {
      handleUpdateTier({ badge: null });
      return;
    }
    handleUpdateTier({ badge: { text: "", tone: "neutral" } });
  }

  function handleUpdateActiveTierFeature(index, patch) {
    if (!activeTier) return;
    const features = Array.isArray(activeTier.features) ? activeTier.features : [];
    if (index < 0 || index >= features.length) return;
    const nextFeatures = [...features];
    nextFeatures[index] = { ...nextFeatures[index], ...patch };
    handleUpdateTier({ features: nextFeatures });
  }

  function handleAddFeature() {
    if (!activeTier) return;
    const features = Array.isArray(activeTier.features) ? activeTier.features : [];
    handleUpdateTier({ features: [...features, createDefaultPriceTierFeature()] });
  }

  function handleRemoveFeature(index) {
    if (!activeTier) return;
    const features = Array.isArray(activeTier.features) ? activeTier.features : [];
    const nextFeatures = features.filter((_, featureIndex) => featureIndex !== index);
    handleUpdateTier({ features: nextFeatures });
  }

  function handleConfirmRemoveTier() {
    if (!pendingTier) return;
    const result = removePricingTier(items, pendingTier.id, resolvedActiveTierId);
    onChange?.(result.items);
    setActiveTierId(result.activeId);
    setPendingRemoveId("");
  }

  const canAddTier = items.length < maxItems;

  return (
    <div className={styles.root}>
      <div className={styles.masterPane}>
        <div className={styles.paneHeader}>
          <strong>Pricing tiers</strong>
          <Button type="button" variant="secondary" size="sm" onClick={handleAddTier} disabled={!canAddTier}>
            Add tier
          </Button>
        </div>

        {!items.length ? <p className={styles.empty}>No tiers yet.</p> : null}

        {items.length ? (
          isHydrated ? (
            <DndContext
              sensors={sensors}
              modifiers={[restrictToVerticalAxis]}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <ul className={styles.tierList}>
                  {items.map((tier, index) => {
                    const title = typeof getItemTitle === "function" ? getItemTitle(tier, index) : `Tier ${index + 1}`;
                    const status = typeof getItemStatus === "function"
                      ? getItemStatus(tier, index)
                      : { label: "Ready", tone: "success" };

                    return (
                      <TierRow
                        key={tier.id}
                        tier={tier}
                        index={index}
                        selected={tier.id === resolvedActiveTierId}
                        onSelect={setActiveTierId}
                        onRequestRemove={setPendingRemoveId}
                        title={title}
                        status={status}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
          ) : (
            <ul className={styles.tierList}>
              {items.map((tier, index) => {
                const title = typeof getItemTitle === "function" ? getItemTitle(tier, index) : `Tier ${index + 1}`;
                const status = typeof getItemStatus === "function"
                  ? getItemStatus(tier, index)
                  : { label: "Ready", tone: "success" };

                return (
                  <TierRow
                    key={tier.id}
                    tier={tier}
                    index={index}
                    selected={tier.id === resolvedActiveTierId}
                    onSelect={setActiveTierId}
                    onRequestRemove={setPendingRemoveId}
                    title={title}
                    status={status}
                    dragDisabled
                  />
                );
              })}
            </ul>
          )
        ) : null}
      </div>

      <div className={styles.detailPane}>
        <div className={styles.paneHeader}>
          <strong>Tier details</strong>
        </div>
        {!activeTier ? <p className={styles.empty}>Select a tier to edit.</p> : null}

        {activeTier ? (
          <div className={styles.detailFields}>
            <Field id={`pricing-tier-${activeTier.id}-name`} label="Tier name" required>
              <Input
                id={`pricing-tier-${activeTier.id}-name`}
                value={activeTier.name || ""}
                onChange={(event) => handleUpdateTier({ name: event.target.value })}
              />
            </Field>

            <Field id={`pricing-tier-${activeTier.id}-description`} label="Description">
              <Textarea
                id={`pricing-tier-${activeTier.id}-description`}
                value={activeTier.description || ""}
                maxLength={descriptionMaxLength}
                onChange={(event) => handleUpdateTier({ description: event.target.value })}
              />
              <p className={styles.counter}>
                {String(activeTier.description || "").length}/{descriptionMaxLength}
              </p>
            </Field>

            <Field id={`pricing-tier-${activeTier.id}-isFree`} label="Free tier">
              <Select
                id={`pricing-tier-${activeTier.id}-isFree`}
                value={activeTier.isFree ? "yes" : "no"}
                options={[
                  { value: "no", label: "No" },
                  { value: "yes", label: "Yes" },
                ]}
                onChange={(nextValue) =>
                  handleUpdateTier({
                    isFree: nextValue === "yes",
                    price: nextValue === "yes" ? null : (activeTier.price || { amountMinor: 0, currency: "GBP" }),
                  })}
              />
            </Field>

            {!activeTier.isFree ? (
              <>
                <Field id={`pricing-tier-${activeTier.id}-currency`} label="Currency" required>
                  <Select
                    id={`pricing-tier-${activeTier.id}-currency`}
                    value={activeTier.price?.currency || "GBP"}
                    options={[
                      { value: "GBP", label: "GBP" },
                      { value: "USD", label: "USD" },
                      { value: "EUR", label: "EUR" },
                    ]}
                    onChange={(nextCurrency) =>
                      handleUpdateTier({
                        price: {
                          amountMinor: Number(activeTier.price?.amountMinor || 0),
                          currency: nextCurrency,
                        },
                      })}
                  />
                </Field>

                <Field id={`pricing-tier-${activeTier.id}-amount`} label="Amount" required hint="Major units (e.g. 19.00)">
                  <Input
                    id={`pricing-tier-${activeTier.id}-amount`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={formatAmountMinorToMajor(activeTier.price?.amountMinor)}
                    onChange={(event) =>
                      handleUpdateTier({
                        price: {
                          amountMinor: parseAmountMajorToMinor(event.target.value),
                          currency: activeTier.price?.currency || "GBP",
                        },
                      })}
                  />
                </Field>

                <Field id={`pricing-tier-${activeTier.id}-interval`} label="Billing interval">
                  <Select
                    id={`pricing-tier-${activeTier.id}-interval`}
                    value={activeTier.interval || "month"}
                    options={intervalOptions.map((value) => ({ value, label: value }))}
                    onChange={(nextInterval) => handleUpdateTier({ interval: nextInterval })}
                  />
                </Field>
              </>
            ) : null}

            <Field id={`pricing-tier-${activeTier.id}-highlight`} label="Highlight tier">
              <Select
                id={`pricing-tier-${activeTier.id}-highlight`}
                value={activeTier.highlight ? "yes" : "no"}
                options={[
                  { value: "no", label: "No" },
                  { value: "yes", label: "Yes" },
                ]}
                onChange={(nextValue) => handleUpdateTier({ highlight: nextValue === "yes" })}
              />
            </Field>

            <div className={styles.inlineActions}>
              <Button type="button" variant="secondary" size="sm" onClick={handleToggleTierBadge}>
                {activeTier.badge ? "Remove badge" : "Add badge"}
              </Button>
            </div>

            {activeTier.badge ? (
              <>
                <Field id={`pricing-tier-${activeTier.id}-badge-text`} label="Badge text" required>
                  <Input
                    id={`pricing-tier-${activeTier.id}-badge-text`}
                    value={activeTier.badge?.text || ""}
                    onChange={(event) =>
                      handleUpdateTier({
                        badge: {
                          ...(activeTier.badge || { tone: "neutral" }),
                          text: event.target.value,
                        },
                      })}
                  />
                </Field>
                <Field id={`pricing-tier-${activeTier.id}-badge-tone`} label="Badge tone">
                  <Select
                    id={`pricing-tier-${activeTier.id}-badge-tone`}
                    value={activeTier.badge?.tone || "neutral"}
                    options={[
                      { value: "neutral", label: "Neutral" },
                      { value: "brand", label: "Brand" },
                      { value: "success", label: "Success" },
                      { value: "warning", label: "Warning" },
                      { value: "danger", label: "Danger" },
                    ]}
                    onChange={(nextTone) =>
                      handleUpdateTier({
                        badge: {
                          ...(activeTier.badge || { text: "" }),
                          tone: nextTone,
                        },
                      })}
                  />
                </Field>
              </>
            ) : null}

            <div className={styles.inlineActions}>
              <Button type="button" variant="secondary" size="sm" onClick={handleToggleTierCta}>
                {activeTier.cta ? "Remove tier CTA" : "Add tier CTA"}
              </Button>
            </div>

            {activeTier.cta ? (
              <>
                <Field id={`pricing-tier-${activeTier.id}-cta-label`} label="CTA label" required>
                  <Input
                    id={`pricing-tier-${activeTier.id}-cta-label`}
                    value={activeTier.cta?.label || ""}
                    onChange={(event) => handleUpdateActiveTierCta({ label: event.target.value })}
                  />
                </Field>
                <Field
                  id={`pricing-tier-${activeTier.id}-cta-href`}
                  label="CTA link"
                  required
                  hint="Use /path for internal links or https:// for external links."
                >
                  <Input
                    id={`pricing-tier-${activeTier.id}-cta-href`}
                    value={activeTier.cta?.href || ""}
                    onChange={(event) => handleUpdateActiveTierCta({ href: event.target.value })}
                  />
                </Field>
              </>
            ) : null}

            <div className={styles.featuresHeader}>
              <strong>Features</strong>
              <Button type="button" variant="secondary" size="sm" onClick={handleAddFeature}>
                Add feature
              </Button>
            </div>

            {!Array.isArray(activeTier.features) || !activeTier.features.length ? (
              <p className={styles.empty}>No features yet.</p>
            ) : (
              <ul className={styles.featuresList}>
                {(activeTier.features || []).map((feature, index) => (
                  <li key={feature.id || `feature-${index}`} className={styles.featureRow}>
                    <Input
                      value={feature.text || ""}
                      onChange={(event) => handleUpdateActiveTierFeature(index, { text: event.target.value })}
                      placeholder={`Feature ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      intent="danger"
                      icon="delete"
                      ariaLabel={`Remove feature ${index + 1}`}
                      onClick={() => handleRemoveFeature(index)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmModal
        open={Boolean(pendingTier)}
        title="Remove pricing tier?"
        message="This will remove the selected tier."
        confirmText="Remove tier"
        onConfirm={handleConfirmRemoveTier}
        onClose={() => setPendingRemoveId("")}
      />
    </div>
  );
}
