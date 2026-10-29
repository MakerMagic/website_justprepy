"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Inter } from "next/font/google";
import { renderSubscriptionPlans } from "./subscription-plans";
import "./subscription-modal.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-subscription",
});

export const subscriptionFontVariable = inter.variable;

export function SubscriptionModal({
  open,
  onClose,
  onAfterClose,
}: {
  open: boolean;
  onClose: () => void;
  onAfterClose?: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const session = useRef<{
    previous: HTMLElement | null;
    overflow: string;
  } | null>(null);
  const afterClose = useRef(onAfterClose);
  const [message, setMessage] = useState("");

  useEffect(() => {
    afterClose.current = onAfterClose;
  }, [onAfterClose]);

  useEffect(() => {
    const element = dialog.current;
    const panel = element?.querySelector<HTMLElement>(".subscription-window");
    if (!element || !panel) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function finishClose() {
      if (!active || !element || !session.current) return;
      const previous = session.current;
      session.current = null;
      element.dataset.state = "closed";
      if (element.open) element.close();
      document.body.style.overflow = previous.overflow;
      if (afterClose.current) afterClose.current();
      else if (previous.previous?.isConnected)
        previous.previous.focus({ preventScroll: true });
    }

    if (open) {
      const reopening = element.open;
      if (reopening) {
        const current = getComputedStyle(panel);
        const backdrop = getComputedStyle(element, "::backdrop");
        panel.style.setProperty(
          "--subscription-enter-transform",
          current.transform,
        );
        panel.style.setProperty(
          "--subscription-enter-opacity",
          current.opacity,
        );
        element.style.setProperty(
          "--subscription-backdrop-enter-color",
          backdrop.backgroundColor,
        );
        element.style.setProperty(
          "--subscription-backdrop-enter-blur",
          backdrop.backdropFilter,
        );
      } else {
        session.current = {
          previous: document.activeElement as HTMLElement | null,
          overflow: document.body.style.overflow,
        };
        panel.style.removeProperty("--subscription-enter-transform");
        panel.style.removeProperty("--subscription-enter-opacity");
        element.style.removeProperty("--subscription-backdrop-enter-color");
        element.style.removeProperty("--subscription-backdrop-enter-blur");
        element.showModal();
        panel.scrollTop = 0;
        document.body.style.overflow = "hidden";
      }
      element.dataset.state = reduced ? "open" : "opening";
      if (!reopening)
        element
          .querySelector<HTMLButtonElement>(".subscription-close")
          ?.focus({ preventScroll: true });
      if (!reduced)
        timer = setTimeout(() => {
          if (active && element.open) element.dataset.state = "open";
        }, 600);
    } else if (element.open) {
      const current = getComputedStyle(panel);
      const backdrop = getComputedStyle(element, "::backdrop");
      panel.style.setProperty(
        "--subscription-exit-transform",
        current.transform,
      );
      panel.style.setProperty("--subscription-exit-opacity", current.opacity);
      element.style.setProperty(
        "--subscription-backdrop-exit-color",
        backdrop.backgroundColor,
      );
      element.style.setProperty(
        "--subscription-backdrop-exit-blur",
        backdrop.backdropFilter,
      );
      element.dataset.state = "closing";
      if (reduced) queueMicrotask(finishClose);
      else timer = setTimeout(finishClose, 220);
    }
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    const element = dialog.current;
    return () => {
      const previous = session.current;
      session.current = null;
      if (element?.open) element.close();
      if (previous) {
        document.body.style.overflow = previous.overflow;
        if (previous.previous?.isConnected)
          previous.previous.focus({ preventScroll: true });
      }
    };
  }, []);

  function requestClose() {
    setMessage("");
    onClose();
  }

  return (
    <dialog
      ref={dialog}
      className={"subscription-overlay " + inter.variable}
      aria-labelledby={id + "-title"}
      aria-describedby={id + "-description"}
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClose={() => setMessage("")}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (!open) {
          event.preventDefault();
          return;
        }
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            "button:not(:disabled), a[href]",
          ),
        ).filter((control) => control.getClientRects().length > 0);
        const first = controls[0];
        const last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
    >
      <div className="subscription-window" inert={!open}>
        <button
          className="subscription-close"
          type="button"
          aria-label="Close subscription plans"
          onClick={requestClose}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M5 5l14 14M19 5 5 19" />
          </svg>
        </button>
        <h2 id={id + "-title"}>Choose your plan</h2>
        <p
          className="subscription-heading-description"
          id={id + "-description"}
        >
          Prepare for NUET with justprepy.
        </p>
        {renderSubscriptionPlans({
          idPrefix: id,
          message,
          onSubscribe: () => setMessage("Checkout is not connected yet."),
        })}
      </div>
    </dialog>
  );
}
