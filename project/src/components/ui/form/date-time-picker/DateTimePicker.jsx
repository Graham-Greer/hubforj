"use client";

import Input from "../input/Input";
import Button from "../../button/Button";
import styles from "./DateTimePicker.module.css";

export default function DateTimePicker({ value = "", onChange, min, max, clearable = true }) {
  const [dateValue = "", timeRaw = ""] = String(value || "").split("T");
  const timeValue = timeRaw.slice(0, 5);
  const [minDate = "", minTimeRaw = ""] = String(min || "").split("T");
  const [maxDate = "", maxTimeRaw = ""] = String(max || "").split("T");
  const minTime = minTimeRaw.slice(0, 5);
  const maxTime = maxTimeRaw.slice(0, 5);

  function emit(nextDate, nextTime) {
    if (!nextDate) {
      onChange?.("");
      return;
    }
    if (!nextTime) {
      onChange?.(nextDate);
      return;
    }
    onChange?.(`${nextDate}T${nextTime}`);
  }

  function setNow() {
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    onChange?.(`${date}T${time}`);
  }

  return (
    <div className={styles.root}>
      <div className={styles.fields}>
        <label className={styles.field}>
          <span className={styles.label}>Date</span>
          <Input
            type="date"
            value={dateValue}
            min={minDate || undefined}
            max={maxDate || undefined}
            onChange={(event) => emit(event.target.value, timeValue)}
          />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>Time</span>
          <Input
            type="time"
            value={timeValue}
            min={dateValue && dateValue === minDate ? minTime || undefined : undefined}
            max={dateValue && dateValue === maxDate ? maxTime || undefined : undefined}
            onChange={(event) => emit(dateValue, event.target.value)}
          />
        </label>
      </div>
      <div className={styles.actions}>
        <Button type="button" variant="tertiary" size="sm" onClick={setNow}>
          Now
        </Button>
        {clearable ? (
          <Button type="button" variant="tertiary" size="sm" onClick={() => onChange?.("")}>
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
