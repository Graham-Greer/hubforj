export function createFormSnapshotFromKeys(form, keys) {
  const formData = new FormData(form);

  return keys.reduce((snapshot, key) => {
    snapshot[key] = String(formData.get(key) || "");
    return snapshot;
  }, {});
}

export function createSavedSnapshotFromKeys(keys, initialValues, values, transform = null) {
  const base = {
    ...initialValues,
    ...values,
  };

  if (typeof transform === "function") {
    return transform(base);
  }

  return keys.reduce((snapshot, key) => {
    snapshot[key] = String(base[key] || "");
    return snapshot;
  }, {});
}
