"use client";
import { useEffect, useRef, type ReactNode } from "react";
/** Source motion on a native modal: focus trap, Escape, inert background and scroll lock. */
export function SettingsDialog({
  open,
  onClose,
  titleId,
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  initialFocus?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const previous = document.activeElement as HTMLElement | null,
      overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>(initialFocus ?? "button")?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);
  return (
    <dialog
      ref={ref}
      className="settings-modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dlg">{children}</div>
    </dialog>
  );
}
