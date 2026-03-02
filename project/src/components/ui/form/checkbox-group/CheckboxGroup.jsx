import Checkbox from "../checkbox/Checkbox";
import styles from "./CheckboxGroup.module.css";

export default function CheckboxGroup({ options = [], value = [], onChange }) {
  const set = new Set(value);

  const toggle = (optionValue, checked) => {
    const next = new Set(set);
    if (checked) next.add(optionValue);
    else next.delete(optionValue);
    onChange?.(Array.from(next));
  };

  return (
    <div className={styles.root}>
      {options.map((option) => (
        <Checkbox
          key={option.value}
          checked={set.has(option.value)}
          onChange={(checked) => toggle(option.value, checked)}
          label={option.label}
        />
      ))}
    </div>
  );
}
