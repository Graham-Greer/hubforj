"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Icon from "../../../primitives/icon/Icon";
import Button from "../../../ui/button/Button";
import ConfirmModal from "../../../ui/confirm-modal/ConfirmModal";
import styles from "./BlockList.module.css";

function restrictToVerticalAxis({ transform }) {
  return {
    ...transform,
    x: 0,
  };
}

function SortableItem({ block, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: block.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[styles.item, isDragging ? styles.dragging : "", isOver ? styles.over : ""].join(" ")}
    >
      <button
        type="button"
        className={styles.handle}
        aria-label={`Drag ${block.label || block.type}`}
        {...attributes}
        {...listeners}
      >
        <Icon name="drag_indicator" size="md" tone="muted" decorative />
      </button>
      <button type="button" className={styles.selectButton} onClick={() => onSelect?.(block.id)}>
        {block.label || block.type}
      </button>
      <Button
        type="button"
        variant="tertiary"
        intent="danger"
        icon={<Icon name="delete" size="sm" decorative />}
        ariaLabel={`Remove ${block.label || block.type}`}
        onClick={() => onRemove?.(block.id)}
      />
    </li>
  );
}

function StaticItem({ block, onSelect, onRemove }) {
  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.handle}
        aria-label={`Drag ${block.label || block.type}`}
        disabled
      >
        <Icon name="drag_indicator" size="md" tone="muted" decorative />
      </button>
      <button type="button" className={styles.selectButton} onClick={() => onSelect?.(block.id)}>
        {block.label || block.type}
      </button>
      <Button
        type="button"
        variant="tertiary"
        intent="danger"
        icon={<Icon name="delete" size="sm" decorative />}
        ariaLabel={`Remove ${block.label || block.type}`}
        onClick={() => onRemove?.(block.id)}
      />
    </li>
  );
}

export default function BlockList({ blocks = [], onMove, onRemove, onSelect }) {
  const [pendingRemoveId, setPendingRemoveId] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((item) => item.id === active.id);
    const newIndex = blocks.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(blocks, oldIndex, newIndex);
    onMove?.(reordered);
  };

  const pendingRemoveBlock = useMemo(
    () => blocks.find((block) => block.id === pendingRemoveId) || null,
    [blocks, pendingRemoveId]
  );

  if (!blocks.length) {
    return <p className={styles.empty}>No blocks yet. Use Section Library to add one.</p>;
  }

  return (
    <>
      {isHydrated ? (
        <DndContext
          sensors={sensors}
          modifiers={[restrictToVerticalAxis]}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={blocks.map((item) => item.id)} strategy={verticalListSortingStrategy}>
            <ul className={styles.root}>
              {blocks.map((block) => (
                <SortableItem
                  key={block.id}
                  block={block}
                  onSelect={onSelect}
                  onRemove={() => setPendingRemoveId(block.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className={styles.root}>
          {blocks.map((block) => (
            <StaticItem
              key={block.id}
              block={block}
              onSelect={onSelect}
              onRemove={() => setPendingRemoveId(block.id)}
            />
          ))}
        </ul>
      )}

      <ConfirmModal
        open={Boolean(pendingRemoveBlock)}
        title="Remove section?"
        message={
          pendingRemoveBlock
            ? `This will remove "${pendingRemoveBlock.label || pendingRemoveBlock.type}" from this page draft.`
            : ""
        }
        confirmText="Remove section"
        onCancel={() => setPendingRemoveId("")}
        onConfirm={() => {
          if (pendingRemoveBlock) onRemove?.(pendingRemoveBlock.id);
          setPendingRemoveId("");
        }}
      />
    </>
  );
}
