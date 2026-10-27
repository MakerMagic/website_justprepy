import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";

type Slot = {
  value?: unknown;
  current?: unknown;
  deps?: readonly unknown[];
  cleanup?: () => void;
};
type Harness = {
  slots: Slot[];
  cursor: number;
  effects: (() => void)[];
  domEffects: boolean;
};
const runtime = vi.hoisted(() => ({ active: null as Harness | null }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  const effect = (
    callback: () => void | (() => void),
    deps: readonly unknown[],
  ) => {
    const h = runtime.active!;
    const slot = (h.slots[h.cursor++] ??= {});
    if (
      !slot.deps ||
      deps.some((value, index) => !Object.is(value, slot.deps![index]))
    ) {
      if (h.domEffects)
        h.effects.push(() => {
          slot.cleanup?.();
          slot.cleanup = callback() || undefined;
        });
      slot.deps = deps;
    }
  };
  return {
    ...actual,
    useId: () => (runtime.active ? "subscription-test" : actual.useId()),
    useRef: (initial: unknown) => {
      if (!runtime.active) return actual.useRef(initial);
      const h = runtime.active;
      return (h.slots[h.cursor++] ??= { current: initial });
    },
    useState: (initial: unknown) => {
      if (!runtime.active) return actual.useState(initial);
      const h = runtime.active;
      const slot = (h.slots[h.cursor++] ??= {
        value: typeof initial === "function" ? initial() : initial,
      });
      return [
        slot.value,
        (next: unknown) => {
          slot.value = typeof next === "function" ? next(slot.value) : next;
        },
      ];
    },
    useEffect: (
      callback: () => void | (() => void),
      deps: readonly unknown[],
    ) => {
      if (!runtime.active) return actual.useEffect(callback, deps);
      effect(callback, deps);
    },
    useSyncExternalStore: (
      ...args: Parameters<typeof actual.useSyncExternalStore>
    ) => (runtime.active ? args[2]?.() : actual.useSyncExternalStore(...args)),
  };
});
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "subscription-font" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/vocabulary" }));
vi.mock("next/dynamic", () => ({
  default: () =>
    function SubscriptionBoundary() {
      return null;
    },
}));

import { SubscriptionModal } from "./subscription-modal";
import { PublicSiteShell } from "../../components/public-site-shell";
import { Sidebar } from "../questions/sidebar";
import { SubscriptionCard } from "../questions/subscription-card";
import { demoQuestionBank } from "../questions/question-bank.fixtures";

type ElementProps = {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  open?: boolean;
  onClose?: () => void;
  onClick?: (event?: unknown) => void;
  onExplore?: () => void;
  ref?: { current: unknown };
  onAfterClose?: () => void;
};
function elements(node: ReactNode): ReactElement<ElementProps>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return isValidElement<ElementProps>(node) ? text(node.props.children) : "";
}
function style() {
  const values = new Map<string, string>();
  return {
    setProperty: (key: string, value: string) => values.set(key, value),
    removeProperty: (key: string) => values.delete(key),
    getPropertyValue: (key: string) => values.get(key),
  };
}
let reduced = false;
let opener: { isConnected: boolean; focus: ReturnType<typeof vi.fn> };
let closeButton: {
  focus: ReturnType<typeof vi.fn>;
  getClientRects: () => object[];
};
let subscribeButton: typeof closeButton;
let doc: { activeElement: unknown; body: { style: { overflow: string } } };
let native: {
  open: boolean;
  style: ReturnType<typeof style>;
  dataset: Record<string, string>;
  showModal: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  querySelector: (selector: string) => unknown;
  querySelectorAll: () => object[];
};
const mounted: Harness[] = [];

function mountModal(initial: ComponentProps<typeof SubscriptionModal>) {
  const h: Harness = { slots: [], cursor: 0, effects: [], domEffects: true };
  mounted.push(h);
  let props = initial;
  let tree: ReactElement;
  function render(update: Partial<typeof props> = {}) {
    props = { ...props, ...update };
    h.cursor = 0;
    runtime.active = h;
    try {
      tree = SubscriptionModal(props);
    } finally {
      runtime.active = null;
    }
    (tree.props as { ref: { current: unknown } }).ref.current = native;
    h.effects.splice(0).forEach((effect) => effect());
    return tree;
  }
  render();
  return {
    render,
    get tree() {
      return tree;
    },
  };
}
function mountBoundary(renderPage: () => ReactElement) {
  const h: Harness = { slots: [], cursor: 0, effects: [], domEffects: false };
  mounted.push(h);
  let tree: ReactElement;
  function render() {
    h.cursor = 0;
    runtime.active = h;
    try {
      tree = renderPage();
    } finally {
      runtime.active = null;
    }
    return elements(tree);
  }
  return { render, nodes: render() };
}
function modalBoundary(nodes: ReactElement<ElementProps>[]) {
  return nodes.find(
    (node) =>
      typeof node.type === "function" &&
      node.type.name === "SubscriptionBoundary",
  )!;
}
function findButton(nodes: ReactElement<ElementProps>[], label: string) {
  return nodes.find(
    (node) => node.type === "button" && text(node.props.children) === label,
  )!;
}

beforeEach(() => {
  vi.useFakeTimers();
  reduced = false;
  opener = { isConnected: true, focus: vi.fn() };
  doc = { activeElement: opener, body: { style: { overflow: "scroll" } } };
  closeButton = {
    focus: vi.fn(() => {
      doc.activeElement = closeButton;
    }),
    getClientRects: () => [{}],
  };
  subscribeButton = {
    focus: vi.fn(() => {
      doc.activeElement = subscribeButton;
    }),
    getClientRects: () => [{}],
  };
  const panel = { style: style() };
  native = {
    open: false,
    style: style(),
    dataset: {},
    showModal: vi.fn(() => {
      native.open = true;
    }),
    close: vi.fn(() => {
      native.open = false;
    }),
    querySelector: (selector) =>
      selector === ".subscription-window" ? panel : closeButton,
    querySelectorAll: () => [closeButton, subscribeButton],
  };
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: reduced }),
    location: { href: "/vocabulary" },
  });
  vi.stubGlobal("document", doc);
  vi.stubGlobal("getComputedStyle", (_element: unknown, pseudo?: string) =>
    pseudo
      ? {
          backgroundColor: "rgba(14, 14, 14, 0.55)",
          backdropFilter: "blur(4px)",
        }
      : { transform: "matrix(0.98, 0, 0, 0.98, 0, 8)", opacity: "0.8" },
  );
});
afterEach(() => {
  mounted.splice(0).forEach((h) => h.slots.forEach((slot) => slot.cleanup?.()));
  runtime.active = null;
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("source-matched subscription plans", () => {
  it("keeps the original prices, feature lists and non-interactive current plan without a demo launcher", () => {
    const html = renderToStaticMarkup(
      <SubscriptionModal open={false} onClose={() => {}} />,
    );
    for (const content of [
      "Choose your plan",
      "Prepare for NUET with justprepy.",
      "Free",
      "Pro",
      "0<span>₸",
      "10,000<span>₸",
      "Limited Mock Tests",
      "Limited Questions",
      "Constrained Vocabulary Practice",
      "Basic Analytics",
      "1500+ Questions",
      "All Explanations Available",
      "Unlimited Mock Tests",
      "500+ Vocabulary Words",
      "Advanced Performance Analytics for You",
    ])
      expect(html).toContain(content);
    expect(html.match(/<li\b/g)).toHaveLength(9);
    expect(html).toContain(
      'class="subscription-current" role="status">Currently using</div>',
    );
    expect(html).not.toMatch(/<button[^>]*>Currently using/);
    expect(html).not.toContain("View plans");
    expect(html).not.toMatch(/<dialog[^>]*\sopen(?:=|\s|>)/);
    expect(html).toContain('data-checkout=""');
  });
  it("opens on demand, traps the background natively and preserves the previous scroll lock", () => {
    doc.body.style.overflow = "hidden";
    const modal = mountModal({ open: false, onClose: vi.fn() });
    expect(native.showModal).not.toHaveBeenCalled();
    modal.render({ open: true });
    expect(native.showModal).toHaveBeenCalledOnce();
    expect(doc.body.style.overflow).toBe("hidden");
    expect(doc.activeElement).toBe(closeButton);
    expect(native.dataset.state).toBe("opening");
    vi.advanceTimersByTime(600);
    expect(native.dataset.state).toBe("open");
    modal.render({ open: false });
    vi.advanceTimersByTime(220);
    expect(doc.body.style.overflow).toBe("hidden");
    expect(opener.focus).toHaveBeenCalledWith({ preventScroll: true });
  });
  it("reports the unconnected checkout without navigating or simulating a purchase", () => {
    const modal = mountModal({ open: true, onClose: vi.fn() });
    findButton(elements(modal.tree), "Subscribe").props.onClick!();
    expect(window.location.href).toBe("/vocabulary");
    expect(text(modal.render())).toContain("Checkout is not connected yet.");
    const panel = native.querySelector(".subscription-window") as {
      scrollTop: number;
    };
    panel.scrollTop = 160;
    findButton(elements(modal.tree), "").props.onClick!();
    modal.render({ open: false });
    vi.advanceTimersByTime(220);
    modal.render({ open: true });
    expect(text(modal.tree)).not.toContain("Checkout is not connected yet.");
    expect(panel.scrollTop).toBe(0);
  });
  it("keeps the dialog and scroll lock until the coordinated closing animation finishes", () => {
    const onClose = vi.fn();
    const afterClose = vi.fn();
    const modal = mountModal({ open: true, onClose, onAfterClose: afterClose });
    vi.advanceTimersByTime(600);
    findButton(elements(modal.tree), "").props.onClick!();
    expect(onClose).toHaveBeenCalledOnce();
    modal.render({ open: false });
    expect(native.dataset.state).toBe("closing");
    expect(native.open).toBe(true);
    vi.advanceTimersByTime(219);
    expect(native.open).toBe(true);
    expect(doc.body.style.overflow).toBe("hidden");
    vi.advanceTimersByTime(1);
    expect(native.open).toBe(false);
    expect(doc.body.style.overflow).toBe("scroll");
    expect(afterClose).toHaveBeenCalledOnce();
    expect(opener.focus).not.toHaveBeenCalled();
  });
  it("routes Escape and backdrop dismissal through the same closing animation while ignoring interior clicks", () => {
    const onClose = vi.fn();
    const modal = mountModal({ open: true, onClose });
    const props = modal.tree.props as {
      onCancel: (event: { preventDefault: () => void }) => void;
      onPointerDown: (event: { target: object; currentTarget: object }) => void;
    };
    const preventDefault = vi.fn();
    props.onCancel({ preventDefault });
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    props.onPointerDown({ target: {}, currentTarget: native });
    expect(onClose).toHaveBeenCalledOnce();
    props.onPointerDown({ target: native, currentTarget: native });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("cycles Tab and Shift+Tab between close and Subscribe", () => {
    const modal = mountModal({ open: true, onClose: vi.fn() });
    const keyDown = (
      modal.tree.props as {
        onKeyDown: (event: {
          key: string;
          shiftKey: boolean;
          currentTarget: typeof native;
          preventDefault: () => void;
        }) => void;
      }
    ).onKeyDown;
    const preventDefault = vi.fn();
    doc.activeElement = subscribeButton;
    keyDown({
      key: "Tab",
      shiftKey: false,
      currentTarget: native,
      preventDefault,
    });
    expect(doc.activeElement).toBe(closeButton);
    keyDown({
      key: "Tab",
      shiftKey: true,
      currentTarget: native,
      preventDefault,
    });
    expect(doc.activeElement).toBe(subscribeButton);
    expect(preventDefault).toHaveBeenCalledTimes(2);
  });
  it("cancels stale exit completion if opening is requested again before close finishes", () => {
    const modal = mountModal({ open: true, onClose: vi.fn() });
    vi.advanceTimersByTime(100);
    modal.render({ open: false });
    vi.advanceTimersByTime(80);
    modal.render({ open: true });
    vi.advanceTimersByTime(600);
    expect(native.open).toBe(true);
    expect(native.close).not.toHaveBeenCalled();
    expect(native.dataset.state).toBe("open");
    modal.render({ open: false });
    vi.advanceTimersByTime(220);
    expect(native.close).toHaveBeenCalledOnce();
    modal.render({ open: true });
    vi.advanceTimersByTime(600);
    expect(native.showModal).toHaveBeenCalledTimes(2);
    expect(native.open).toBe(true);
  });
  it("skips spatial motion and closes without an animation delay for reduced motion", async () => {
    reduced = true;
    const modal = mountModal({ open: true, onClose: vi.fn() });
    expect(native.dataset.state).toBe("open");
    expect(vi.getTimerCount()).toBe(0);
    modal.render({ open: false });
    await Promise.resolve();
    expect(native.open).toBe(false);
    expect(doc.body.style.overflow).toBe("scroll");
  });
  it("restores background scrolling and cancels pending work on unmount", () => {
    const afterClose = vi.fn();
    mountModal({ open: true, onClose: vi.fn(), onAfterClose: afterClose });
    mounted.pop()!.slots.forEach((slot) => slot.cleanup?.());
    expect(native.open).toBe(false);
    expect(doc.body.style.overflow).toBe("scroll");
    vi.advanceTimersByTime(1000);
    expect(afterClose).not.toHaveBeenCalled();
  });
});

describe("existing subscription entry points", () => {
  it("opens from both public actions without replacing or navigating the page", () => {
    for (const label of ["Subscribe", "Subscription"]) {
      const page = mountBoundary(() =>
        PublicSiteShell({
          page: "contact",
          children: <main>Underlying page state</main>,
        }),
      );
      expect(modalBoundary(page.nodes).props.open).toBe(false);
      findButton(page.nodes, label).props.onClick!();
      let nodes = page.render();
      expect(modalBoundary(nodes).props.open).toBe(true);
      expect(
        nodes.some(
          (node) =>
            node.type === "main" && text(node) === "Underlying page state",
        ),
      ).toBe(true);
      modalBoundary(nodes).props.onClose!();
      nodes = page.render();
      expect(modalBoundary(nodes).props.open).toBe(false);
    }
  });
  it("connects the existing compact Pro and expanded Try Now promotion through their shared callback", () => {
    const page = mountBoundary(() =>
      Sidebar({ profile: demoQuestionBank.profile }),
    );
    const promotion = page.nodes.find(
      (node) => node.type === SubscriptionCard,
    )!;
    const buttons = elements(
      SubscriptionCard({
        expanded: true,
        onExplore: promotion.props.onExplore!,
      }),
    ).filter((node) => node.type === "button");
    expect(buttons).toHaveLength(2);
    for (const button of buttons) {
      button.props.onClick!();
      const nodes = page.render();
      expect(modalBoundary(nodes).props.open).toBe(true);
      modalBoundary(nodes).props.onClose!();
      page.render();
    }
  });
  it("enables only Subscription in the existing account menu and closes its popover", () => {
    const page = mountBoundary(() =>
      Sidebar({ profile: demoQuestionBank.profile }),
    );
    const trigger = findButton(page.nodes, "Subscription");
    expect(trigger.props.disabled).toBe(false);
    expect(findButton(page.nodes, "Settings").props.disabled).toBe(true);
    expect(findButton(page.nodes, "Sign out").props.disabled).toBe(true);
    const hidePopover = vi.fn();
    trigger.props.onClick!({
      currentTarget: { closest: () => ({ hidePopover }) },
    });
    expect(hidePopover).toHaveBeenCalledOnce();
    expect(modalBoundary(page.render()).props.open).toBe(true);
  });
});
