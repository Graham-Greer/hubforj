"use client";

import { useMemo, useState } from "react";
import Button from "../button/Button";
import styles from "./FileUpload.module.css";

export default function FileUpload({ multiple = true, accept, maxFiles = 10, onUpload, onRemove }) {
  const [files, setFiles] = useState([]);

  const canUpload = files.length > 0;
  const remaining = useMemo(() => Math.max(maxFiles - files.length, 0), [files.length, maxFiles]);

  const onChange = (event) => {
    const next = Array.from(event.target.files || []).slice(0, remaining);
    setFiles((prev) => [...prev, ...next].slice(0, maxFiles));
  };

  const remove = (name) => {
    setFiles((prev) => prev.filter((file) => file.name !== name));
    onRemove?.(name);
  };

  const submit = () => {
    onUpload?.(files);
  };

  return (
    <div className={styles.root}>
      <input type="file" multiple={multiple} accept={accept} onChange={onChange} className={styles.input} />
      <ul className={styles.list}>
        {files.map((file) => (
          <li key={file.name} className={styles.item}>
            <span>{file.name}</span>
            <button type="button" onClick={() => remove(file.name)} className={styles.removeButton}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <Button onClick={submit} disabled={!canUpload}>
        Upload ({files.length})
      </Button>
    </div>
  );
}
