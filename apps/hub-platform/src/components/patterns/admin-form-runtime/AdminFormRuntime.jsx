"use client";

import { createContext, useContext, useMemo, useState } from "react";

const AdminFormRuntimeContext = createContext({
  hasProvider: false,
  isDirty: false,
  setIsDirty: () => {},
});

export function AdminFormRuntimeProvider({ children }) {
  const [isDirty, setIsDirty] = useState(false);
  const value = useMemo(
    () => ({
      hasProvider: true,
      isDirty,
      setIsDirty,
    }),
    [isDirty]
  );

  return (
    <AdminFormRuntimeContext.Provider value={value}>
      {children}
    </AdminFormRuntimeContext.Provider>
  );
}

export function useAdminFormRuntime() {
  return useContext(AdminFormRuntimeContext);
}
