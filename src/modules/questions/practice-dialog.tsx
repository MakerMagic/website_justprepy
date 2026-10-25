"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "./icon";

/** Native top-layer dialog supplies focus trapping, inert background and Escape behavior. */
export function PracticeDialog({
  open,
  onClose,
  titleId,
  className,
  children,
  initialFocus,
}: {
  open: boolean;
  onClose: () => void;
  titleId: string;
  className: string;
  children: ReactNode;
  initialFocus?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    const target = element.querySelector<HTMLElement>(
      initialFocus ?? ".practice-dialog-close",
    );
    target?.focus({ preventScroll: true });
    if (initialFocus)
      target?.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: "instant",
      });
    return () => {
      if (element.open) element.close();
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open, initialFocus]);
  return (
    <dialog
      id={titleId + "-dialog"}
      ref={dialog}
      className={"practice-dialog " + className}
      aria-labelledby={titleId}
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = [
          ...event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), a[href], [tabindex="0"]',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}

export function PracticeDialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="icon-button practice-dialog-close"
      aria-label="Close dialog"
      onClick={onClose}
    >
      <Icon name="cross" size={18} />
    </button>
  );
}
