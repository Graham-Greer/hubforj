"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Toast from "./Toast";
import styles from "./ToastProvider.module.css";

const ToastContext = createContext({ pushToast: () => {}, removeToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children, position = "bottom-right", durationDefault = 4000 }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (toast) => {
      const id = crypto.randomUUID();
      setToasts((items) => [...items, { id, ...toast }]);
      window.setTimeout(() => removeToast(id), toast.duration || durationDefault);
      return id;
    },
    [durationDefault, removeToast]
  );

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={[styles.viewport, styles[`position_${position}`]].join(" ")}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
