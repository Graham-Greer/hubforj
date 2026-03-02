"use client";

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
import Button from "../../../ui/button/Button";
import styles from "./BlockList.module.css";

function SortableItem({ block, onSelect, onRemove }) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({ id: block.id });

  return (
    <li
      ref={setNodeRef}
      className={[styles.item, isDragging ? styles.dragging : ""].join(" ")}
    >
      <button type="button" className={styles.selectButton} onClick={() => onSelect?.(block.id)}>
        {block.label || block.type}
      </button>
      <button
        type="button"
        className={styles.handle}
        aria-label={`Drag ${block.label || block.type}`}
        {...attributes}
        {...listeners}
      >
        Drag
      </button>
      <Button variant="tertiary" intent="danger" onClick={() => onRemove?.(block.id)}>
        Remove
      </Button>
    </li>
  );
}

export default function BlockList({ blocks = [], onMove, onRemove, onSelect }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 180, tolerance: 5 },
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

  if (!blocks.length) {
    return <p className={styles.empty}>No blocks yet. Use BlockPicker to add one.</p>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={blocks.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className={styles.root}>
          {blocks.map((block) => (
            <SortableItem key={block.id} block={block} onSelect={onSelect} onRemove={onRemove} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
