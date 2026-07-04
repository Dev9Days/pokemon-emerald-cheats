import { Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TOAST_EVENT_NAME } from "../utils/toast";
import type { ToastPayload } from "../utils/toast";

const TOAST_DURATION_MS = 1800;

export function Toast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    function clearTimer() {
      if (timerRef.current === null) return;
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    function handleToast(event: Event) {
      const toastEvent = event as CustomEvent<ToastPayload>;
      clearTimer();
      setToast(toastEvent.detail);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        setToast(null);
      }, TOAST_DURATION_MS);
    }

    window.addEventListener(TOAST_EVENT_NAME, handleToast);

    return () => {
      clearTimer();
      window.removeEventListener(TOAST_EVENT_NAME, handleToast);
    };
  }, []);

  if (!toast) return null;

  const Icon = toast.variant === "success" ? Check : X;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className={`toast__icon toast__icon--${toast.variant}`} aria-hidden="true">
        <Icon size={16} strokeWidth={3} />
      </span>
      <span>{toast.message}</span>
    </div>
  );
}
