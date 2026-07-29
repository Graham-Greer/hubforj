"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAdminFormRuntime } from "@/components/patterns/admin-form-runtime/AdminFormRuntime";

function snapshotsMatch(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export default function useDirtyFormState({ initialSnapshot, createFormSnapshot }) {
  const formRef = useRef(null);
  const [savedSnapshot, setSavedSnapshot] = useState(initialSnapshot);
  const [isDirty, setIsDirty] = useState(false);
  const { hasProvider, setIsDirty: setRuntimeDirty } = useAdminFormRuntime();

  const updateDirtyState = useCallback(() => {
    if (!formRef.current) {
      return;
    }

    const currentSnapshot = createFormSnapshot(formRef.current);
    setIsDirty(!snapshotsMatch(currentSnapshot, savedSnapshot));
  }, [createFormSnapshot, savedSnapshot]);

  const markSaved = useCallback((nextSnapshot) => {
    setSavedSnapshot(nextSnapshot);
    setIsDirty(false);
  }, []);

  const scheduleDirtyStateUpdate = useCallback(() => {
    requestAnimationFrame(() => {
      updateDirtyState();
    });
  }, [updateDirtyState]);

  useEffect(() => {
    if (!hasProvider) {
      return;
    }

    setRuntimeDirty(isDirty);
  }, [hasProvider, isDirty, setRuntimeDirty]);

  useEffect(() => {
    if (!hasProvider) {
      return undefined;
    }

    return () => {
      setRuntimeDirty(false);
    };
  }, [hasProvider, setRuntimeDirty]);

  return {
    formRef,
    isDirty,
    updateDirtyState,
    scheduleDirtyStateUpdate,
    markSaved,
  };
}
