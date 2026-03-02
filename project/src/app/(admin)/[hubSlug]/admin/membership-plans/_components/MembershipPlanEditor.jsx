"use client";

import { useState } from "react";
import Button from "@/components/ui/button/Button";
import Field from "@/components/ui/form/field/Field";
import FormGrid from "@/components/ui/form/form-grid/FormGrid";
import Input from "@/components/ui/form/input/Input";
import Select from "@/components/ui/form/select/Select";
import Switch from "@/components/ui/form/switch/Switch";
import WysiwygEditor from "@/components/ui/form/wysiwyg/WysiwygEditor";
import styles from "./MembershipPlanEditor.module.css";

export default function MembershipPlanEditor({ action, defaults, hubSlug }) {
  const [description, setDescription] = useState(defaults.description || "");
  const [durationUnit, setDurationUnit] = useState(defaults.durationUnit || "months");
  const [active, setActive] = useState(Boolean(defaults.active));

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="hubSlug" value={hubSlug} />
      <input type="hidden" name="planId" value={defaults.id || ""} />
      <input type="hidden" name="description" value={description} />
      <input type="hidden" name="active" value={active ? "true" : "false"} />

      <FormGrid columns={2}>
        <Field id="title" label="Title" required>
          <Input id="title" name="title" required defaultValue={defaults.title || ""} />
        </Field>
        <Field id="price" label="Price" required>
          <Input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={String(defaults.price ?? 0)} />
        </Field>
      </FormGrid>

      <FormGrid columns={2}>
        <Field id="durationUnit" label="Duration unit" required>
          <Select
            id="durationUnit"
            name="durationUnit"
            required
            value={durationUnit}
            onChange={setDurationUnit}
            options={[
              { value: "days", label: "Days" },
              { value: "months", label: "Months" },
              { value: "years", label: "Years" },
            ]}
          />
        </Field>
        <Field id="durationValue" label="Duration value" required>
          <Input
            id="durationValue"
            name="durationValue"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={String(defaults.durationValue || 1)}
          />
        </Field>
      </FormGrid>

      <Field id="description" label="Description (optional)">
        <WysiwygEditor value={description} onChange={setDescription} />
      </Field>

      <Field id="active" label="Active plan">
        <Switch checked={active} onChange={setActive} label="Plan is available for new memberships" />
      </Field>

      <div className={styles.actions}>
        <Button type="submit">{defaults.id ? "Save plan" : "Create plan"}</Button>
      </div>
    </form>
  );
}
