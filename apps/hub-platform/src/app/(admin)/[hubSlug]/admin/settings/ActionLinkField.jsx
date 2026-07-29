"use client";

"use client";

import AdminSelect from "@/components/ui/admin-select/AdminSelect";
import Input from "@/components/ui/input/Input";
import styles from "./settings.module.css";

export default function ActionLinkField({
  title,
  prefix,
  values,
  internalOptions,
}) {
  const actionLinkOptions = [{ value: "", label: "Select a page" }, ...internalOptions];

  return (
    <div className={styles.actionField}>
      <div className={styles.actionFieldHeader}>
        <h3 className={styles.actionFieldTitle}>{title}</h3>
      </div>
      <div className={styles.actionFieldBody}>
        <Input
          name={`${prefix}Label`}
          label="Action text"
          hint="Short button text shown to visitors."
          defaultValue={values[`${prefix}Label`]}
        />
        <div className={styles.actionDestination}>
          <AdminSelect
            name={`${prefix}Destination`}
            label="Action link"
            hint="Choose which community page this action should open."
            defaultValue={values[`${prefix}Destination`]}
            options={actionLinkOptions}
          />
        </div>
      </div>
    </div>
  );
}
