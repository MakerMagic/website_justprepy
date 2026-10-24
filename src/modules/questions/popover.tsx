"use client";
import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "./icon";
import { animateAccountDisclosure } from "./account-disclosure";
import { placePopover } from "./popover-position";
export function Popover({
  id,
  title,
  trigger,
  children,
  className = "",
  triggerClassName,
  onOpen,
  action,
  pressed,
}: {
  id: string;
  title: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
  onOpen?: () => void;
  action?: ReactNode;
  pressed?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const disclosure = useRef<Animation[]>([]);
  const account = className.includes("account");
  const position = useCallback(() => {
    const popup = panel.current,
      target = button.current;
    if (!popup || !target || !popup.matches(":popover-open")) return;
    const viewport = {
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
    };
    popup.style.maxHeight = "";
    popup.style.maxWidth = `${viewport.width - 24}px`;
    const coordinates = placePopover(
      target.getBoundingClientRect(),
      { width: popup.offsetWidth, height: popup.offsetHeight },
      viewport,
      account,
    );
    popup.style.setProperty("--popover-left", `${coordinates.left}px`);
    popup.style.setProperty("--popover-top", `${coordinates.top}px`);
    popup.style.maxHeight = `${coordinates.height}px`;
    popup.dataset.placement = coordinates.placement;
  }, [account]);
  useLayoutEffect(() => {
    if (!open) return;
    const popup = panel.current,
      target = button.current;
    if (!popup || !target) return;
    position();
    const observer = new ResizeObserver(position);
    observer.observe(target);
    observer.observe(popup);
    const navigation = target.closest(".sidebar");
    if (navigation) observer.observe(navigation);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    navigation?.addEventListener("transitionend", position);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      navigation?.removeEventListener("transitionend", position);
    };
  }, [open, position]);
  return (
    <div className={`popover-owner ${className}`}>
      <button
        ref={button}
        type="button"
        className={
          triggerClassName ?? (account ? "profile-trigger" : "filter-value")
        }
        popoverTarget={id}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-label={account ? "Open account menu" : undefined}
        aria-expanded={open}
        aria-pressed={pressed}
        onClick={(event) => {
          // Own the opening transaction: measure the real invoker before the browser paints.
          event.preventDefault();
          const popup = panel.current;
          if (!popup) return;
          if (popup.matches(":popover-open")) popup.hidePopover();
          else {
            onOpen?.();
            popup.showPopover();
            position();
            if (account && button.current)
              disclosure.current = animateAccountDisclosure(
                popup,
                button.current,
                true,
                disclosure.current,
              );
            setOpen(true);
          }
        }}
      >
        {trigger}
      </button>
      <div
        ref={panel}
        id={id}
        popover="auto"
        role="dialog"
        aria-labelledby={`${id}-title`}
        className={`floating-panel ${className}`}
        onBeforeToggle={(event) => {
          if (account && event.newState === "closed" && button.current)
            disclosure.current = animateAccountDisclosure(
              event.currentTarget,
              button.current,
              false,
              disclosure.current,
            );
          if (
            event.newState === "closed" &&
            event.currentTarget.contains(document.activeElement)
          )
            button.current?.focus({ preventScroll: true });
        }}
        onToggle={(event) => {
          const visible = event.currentTarget.matches(":popover-open");
          setOpen(visible);
          if (!visible && panel.current?.contains(document.activeElement))
            button.current?.focus({ preventScroll: true });
        }}
      >
        <div className="popover-heading">
          <h2 id={`${id}-title`}>
            {!account && (
              <Icon
                name={className.includes("telegram") ? "community" : "calendar"}
                size={18}
              />
            )}{" "}
            {title}
          </h2>
          {action}
          <button
            type="button"
            autoFocus
            className="icon-button"
            aria-label={`Close ${title.toLowerCase()}`}
            popoverTarget={id}
            popoverTargetAction="hide"
          >
            <Icon name="cross" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
