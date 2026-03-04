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
import Button from "@/components/ui/button/Button";
import ConfirmModal from "@/components/ui/confirm-modal/ConfirmModal";
import DraggableAccordionItem from "@/components/patterns/cms/draggable-accordion-item/DraggableAccordionItem";
import useHydrated from "@/hooks/useHydrated";
import {
  appendCreatedItem,
  getRepeatableItemStatus,
  removeItemById,
  reorderItemsByIds,
  updateItemAtIndex,
} from "@/lib/cms/editor-interactions";
import styles from "./RepeatableListEditor.module.css";

function restrictToVerticalAxis({ transform }) {
  return { ...transform, x: 0 };
}

function SortableRow({ item, index, totalItems, onChange, onRequestRemove, renderItemFields }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = getRepeatableItemStatus(item);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[styles.item, isDragging ? styles.dragging : "", isOver ? styles.over : ""].join(" ")}
    >
      <DraggableAccordionItem
        title={item.title?.trim() || `Item ${index + 1}`}
        subtitle={item.subtitle || ""}
        statusLabel={status.label}
        statusTone={status.tone}
        defaultOpen={index === totalItems - 1}
        dragHandleLabel={`Drag item ${index + 1}`}
        dragAttributes={attributes}
        dragListeners={listeners}
        actionItems={[
          {
            key: "remove",
            icon: "delete",
            intent: "danger",
            ariaLabel: `Remove item ${index + 1}`,
            onClick: () => onRequestRemove?.(item.id),
          },
        ]}
      >
        {renderItemFields?.({
          item,
          index,
          onChange: (next) => onChange?.(index, next),
        })}
      </DraggableAccordionItem>
    </li>
  );
}

function StaticRow({ item, index, totalItems, onChange, onRequestRemove, renderItemFields }) {
  const status = getRepeatableItemStatus(item);

  return (
    <li className={styles.item}>
      <DraggableAccordionItem
        title={item.title?.trim() || `Item ${index + 1}`}
        subtitle={item.subtitle || ""}
        statusLabel={status.label}
        statusTone={status.tone}
        defaultOpen={index === totalItems - 1}
        dragHandleLabel={`Drag item ${index + 1}`}
        dragDisabled
        actionItems={[
          {
            key: "remove",
            icon: "delete",
            intent: "danger",
            ariaLabel: `Remove item ${index + 1}`,
            onClick: () => onRequestRemove?.(item.id),
          },
        ]}
      >
        {renderItemFields?.({
          item,
          index,
          onChange: (next) => onChange?.(index, next),
        })}
      </DraggableAccordionItem>
    </li>
  );
}

export default function RepeatableListEditor({
  items = [],
  onChange,
  onCreateItem,
  renderItemFields,
  title = "Items",
  addLabel = "Add item",
  removeTitle = "Remove item?",
  removeMessage = "This action cannot be undone.",
}) {
  const [pendingRemoveId, setPendingRemoveId] = useState("");
  const isHydrated = useHydrated();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pendingItem = useMemo(
    () => items.find((item) => item.id === pendingRemoveId) || null,
    [items, pendingRemoveId]
  );

  function handleItemChange(index, nextItem) {
    onChange?.(updateItemAtIndex(items, index, nextItem));
  }

  function handleAddItem() {
    onChange?.(appendCreatedItem(items, onCreateItem));
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const reordered = reorderItemsByIds(items, active.id, over.id);
    if (reordered === items) return;
    onChange?.(reordered);
  }

  function handleConfirmRemove() {
    if (!pendingItem) return;
    onChange?.(removeItemById(items, pendingItem.id));
    setPendingRemoveId("");
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <strong>{title}</strong>
        <Button type="button" variant="secondary" onClick={handleAddItem}>{addLabel}</Button>
      </div>

      {!items.length ? <p className={styles.empty}>No items yet.</p> : null}

      {items.length ? (
        isHydrated ? (
          <DndContext
            sensors={sensors}
            modifiers={[restrictToVerticalAxis]}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <ul className={styles.list}>
                {items.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    index={index}
                    totalItems={items.length}
                    onChange={handleItemChange}
                    onRequestRemove={setPendingRemoveId}
                    renderItemFields={renderItemFields}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        ) : (
          <ul className={styles.list}>
            {items.map((item, index) => (
              <StaticRow
                key={item.id}
                item={item}
                index={index}
                totalItems={items.length}
                onChange={handleItemChange}
                onRequestRemove={setPendingRemoveId}
                renderItemFields={renderItemFields}
              />
            ))}
          </ul>
        )
      ) : null}

      <ConfirmModal
        open={Boolean(pendingItem)}
        title={removeTitle}
        message={removeMessage}
        confirmText="Remove"
        onCancel={() => setPendingRemoveId("")}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
