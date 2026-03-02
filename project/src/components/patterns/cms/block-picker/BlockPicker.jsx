import Button from "../../../ui/button/Button";
import styles from "./BlockPicker.module.css";

export default function BlockPicker({ availableBlocks = [], onPick }) {
  if (!availableBlocks.length) {
    return <p className={styles.empty}>No block types are currently registered.</p>;
  }

  return (
    <div className={styles.root}>
      {availableBlocks.map((block) => (
        <Button key={block.type} variant="secondary" onClick={() => onPick?.(block.type)}>
          {block.label}
        </Button>
      ))}
    </div>
  );
}
