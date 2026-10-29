"use client";
import Image from "next/image";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { flushSync } from "react-dom";
import type { QuestionBankData } from "./question-bank.types";
import { Icon } from "./icon";
import { Popover } from "./popover";
import { SubscriptionCard } from "./subscription-card";

const SubscriptionModal = dynamic(
  () =>
    import("../subscription/subscription-modal").then(
      (module) => module.SubscriptionModal,
    ),
  { ssr: false },
);

function subscribeMobile(callback: () => void) {
  const media = window.matchMedia("(max-width: 639px)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
const navigation = [
  { label: "Question Bank", icon: "book", href: "/" },
  { label: "Mock Tests", icon: "test", href: "/mock-tests" },
  { label: "Vocabulary", icon: "vocabulary", href: "/vocabulary" },
  { label: "Leaderboard", icon: "chart", href: "/leaderboard", group: true },
  { label: "Analytics", icon: "chart", href: "/analytics" },
  { label: "Contact us", icon: "help", href: "/contact" },
  { label: "Earn money", icon: "earn", href: "/earn" },
];
function NavigationFill({ filterId }: { filterId: string }) {
  return (
    <span className="nav-fill" aria-hidden="true">
      <span
        className="nav-fill-blobs"
        style={{ filter: `url("#${filterId}")` }}
      >
        <span className="nav-fill-blob" />
        <span className="nav-fill-blob" />
        <span className="nav-fill-blob" />
        <span className="nav-fill-blob" />
      </span>
    </span>
  );
}
export function Sidebar({ profile }: { profile: QuestionBankData["profile"] }) {
  const pathname = usePathname();
  const activeHref =
    pathname === "/leaderboard" ||
    pathname === "/mock-tests" ||
    pathname === "/vocabulary" ||
    pathname === "/analytics"
      ? pathname
      : "/";
  const fillId = "sidebar-fill-" + useId().replaceAll(":", "");
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const highlightedItem = hoveredItem ?? activeHref;
  const leaveItem = (id: string) =>
    setHoveredItem((current) => (current === id ? null : current));
  const [touchOpen, setTouchOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [unavailable, setUnavailable] = useState<string | null>(null);
  const notice = useRef<HTMLDialogElement>(null);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const subscriptionOrigin = useRef<"promotion" | "account">("promotion");
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab") setKeyboard(true);
    };
    const pointer = () => setKeyboard(false);
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", pointer);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", pointer);
    };
  }, []);
  useEffect(() => {
    if (unavailable && !notice.current?.open) notice.current?.showModal();
  }, [unavailable]);
  const mobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 639px)").matches,
    () => false,
  );
  const aside = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobile || !touchOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const workspace = document.querySelector<HTMLElement>(".workspace");
    if (workspace) workspace.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    aside.current?.querySelector<HTMLButtonElement>(".drawer-close")?.focus();
    function trap(event: KeyboardEvent) {
      if (event.key !== "Tab") return;
      const controls = Array.from(
        aside.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex="0"]',
        ) ?? [],
      ).filter((element) => element.getClientRects().length > 0);
      const first = controls[0],
        last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", trap);
    return () => {
      if (workspace) workspace.inert = false;
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", trap);
      previous?.focus({ preventScroll: true });
    };
  }, [mobile, touchOpen]);
  const expanded = pointerInside || (keyboard && focusInside) || touchOpen;

  function restoreSubscriptionFocus() {
    if (keyboard) {
      flushSync(() => setFocusInside(true));
    }
    const selector =
      subscriptionOrigin.current === "account"
        ? ".profile-trigger"
        : keyboard || expanded
          ? ".subscription-action"
          : ".subscription-compact";
    aside.current
      ?.querySelector<HTMLButtonElement>(selector)
      ?.focus({ preventScroll: true });
  }
  return (
    <>
      {touchOpen && (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="Close navigation"
          onClick={() => setTouchOpen(false)}
        />
      )}
      <aside
        ref={aside}
        id="site-navigation"
        inert={mobile && !touchOpen}
        role={mobile && touchOpen ? "dialog" : undefined}
        aria-modal={mobile && touchOpen ? true : undefined}
        className="sidebar"
        data-touch-open={touchOpen}
        data-expanded={expanded}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setPointerInside(true);
        }}
        onPointerLeave={(event) => {
          if (
            !(event.relatedTarget instanceof Node) ||
            !event.currentTarget.contains(event.relatedTarget)
          ) {
            setPointerInside(false);
            setHoveredItem(null);
          }
        }}
        onFocusCapture={() => setFocusInside(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setFocusInside(false);
        }}
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (
            event.key === "Escape" &&
            !aside.current?.querySelector(":popover-open")
          )
            setTouchOpen(false);
        }}
      >
        <svg
          className="nav-fill-definitions"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <filter id={fillId}>
              <feGaussianBlur
                in="SourceGraphic"
                result="blur"
                stdDeviation="10"
              />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 21 -7"
                result="goo"
              />
              <feBlend in2="goo" in="SourceGraphic" result="mix" />
            </filter>
          </defs>
        </svg>
        <Link
          href="/"
          className="sidebar-logo"
          aria-label="JustPrepy question bank"
        >
          <Image
            className="logo-monogram"
            src="/brand/justprepy-mark.svg"
            width={98}
            height={86}
            alt=""
            priority
          />
          <Image
            className="logo-wordmark"
            src="/brand/justprepy-logo.png"
            width={347}
            height={86}
            alt="JustPrepy"
            priority
          />{" "}
        </Link>
        <button
          type="button"
          className="drawer-close icon-button"
          aria-label="Close navigation"
          onClick={() => setTouchOpen(false)}
        >
          <Icon name="cross" />
        </button>
        <button
          type="button"
          className="rail-toggle icon-button"
          aria-label="Toggle navigation"
          aria-expanded={touchOpen}
          onClick={() => setTouchOpen((value) => !value)}
        >
          <Icon name="menu" />
        </button>
        <nav aria-label="Practice navigation">
          <p className="nav-section">Practice</p>
          {navigation.map((item) => (
            <div key={item.label}>
              {item.group && <p className="nav-section extra-label">Extra</p>}
              {item.href ? (
                <Link
                  className={`nav-item${item.href === activeHref ? " is-active" : ""}`}
                  href={item.href}
                  data-highlighted={item.href === highlightedItem}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch")
                      setHoveredItem(item.href);
                  }}
                  onPointerLeave={() => leaveItem(item.href)}
                  onPointerCancel={() => leaveItem(item.href)}
                  aria-current={item.href === activeHref ? "page" : undefined}
                  title={item.label}
                  onClick={() => setTouchOpen(false)}
                >
                  <Icon name={item.icon} />
                  <span className="nav-text">{item.label}</span>
                  <NavigationFill filterId={fillId} />
                </Link>
              ) : (
                <button
                  type="button"
                  className="nav-item"
                  data-highlighted={item.label === highlightedItem}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch")
                      setHoveredItem(item.label);
                  }}
                  onPointerLeave={() => leaveItem(item.label)}
                  onPointerCancel={() => leaveItem(item.label)}
                  onClick={() => setUnavailable(item.label)}
                >
                  <Icon name={item.icon} />
                  <span className="nav-text">{item.label}</span>
                  <NavigationFill filterId={fillId} />
                </button>
              )}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <SubscriptionCard
            expanded={expanded}
            onExplore={() => {
              subscriptionOrigin.current = "promotion";
              setSubscriptionOpen(true);
            }}
          />
          <Popover
            id="account-menu"
            title="Account"
            className="account-popover"
            trigger={
              <>
                <span className="avatar">{profile.initials}</span>
                <span className="profile-details">
                  <strong>{profile.name}</strong>
                  <span>Demo account</span>
                </span>
                <Icon name="down" size={16} />
              </>
            }
          >
            <>
              <div className="account-summary">
                <strong>{profile.name}</strong>
                <span className="status-badge">{profile.plan}</span>
              </div>
              <div className="account-actions">
                {[
                  { name: "Settings", icon: "settings" },
                  { name: "Subscription", icon: "card" },
                  { name: "Sign out", icon: "logout" },
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    disabled={item.name !== "Subscription"}
                    onClick={(event) => {
                      if (item.name !== "Subscription") return;
                      subscriptionOrigin.current = "account";
                      event.currentTarget
                        .closest<HTMLElement>("[popover]")
                        ?.hidePopover();
                      setSubscriptionOpen(true);
                    }}
                  >
                    <Icon name={item.icon} />
                    <span>{item.name}</span>
                    <Icon name="chevron" size={16} />
                  </button>
                ))}
              </div>
              <p className="unavailable-note">
                Settings and sign out are unavailable in this demo.
              </p>
            </>
          </Popover>
        </div>
      </aside>
      <SubscriptionModal
        open={subscriptionOpen}
        onClose={() => setSubscriptionOpen(false)}
        onAfterClose={restoreSubscriptionFocus}
      />
      <dialog
        ref={notice}
        className="topic-dialog"
        aria-labelledby="unavailable-title"
        onClose={() => setUnavailable(null)}
      >
        <div className="popover-heading">
          <h2 id="unavailable-title">{unavailable}</h2>
          <button
            type="button"
            className="icon-button"
            autoFocus
            aria-label="Close feature notice"
            onClick={() => notice.current?.close()}
          >
            <Icon name="cross" />
          </button>
        </div>
        <p className="preview-note">
          This feature is not available in the frontend preview.
        </p>
        <button
          type="button"
          className="button primary"
          onClick={() => notice.current?.close()}
        >
          Back to Question Bank
        </button>
      </dialog>
      <nav
        className="mobile-navigation"
        aria-label="Mobile navigation"
        inert={mobile && touchOpen}
      >
        <Link href="/" aria-current={activeHref === "/" ? "page" : undefined}>
          <Icon name="book" />
          <span>Question Bank</span>
        </Link>
        <Link
          href="/mock-tests"
          aria-current={activeHref === "/mock-tests" ? "page" : undefined}
        >
          <Icon name="test" />
          <span>Mock Tests</span>
        </Link>
        <button
          type="button"
          aria-expanded={touchOpen}
          aria-controls="site-navigation"
          onClick={() => setTouchOpen((value) => !value)}
        >
          <Icon name="menu" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
