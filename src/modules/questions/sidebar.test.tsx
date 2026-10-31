import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { demoQuestionBank } from "./question-bank.fixtures";

type Harness = {
  slots: { value?: unknown; current?: unknown }[];
  cursor: number;
};
const runtime = vi.hoisted(() => ({ active: null as Harness | null }));
const route = vi.hoisted(() => ({ pathname: "/app" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
// Exercise the real sidebar's pointer handlers without adding a DOM dependency.
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useId: () => (runtime.active ? "sidebar-test" : actual.useId()),
    useRef: (initial: unknown) => {
      const h = runtime.active;
      return h
        ? (h.slots[h.cursor++] ??= { current: initial })
        : actual.useRef(initial);
    },
    useState: (initial: unknown) => {
      const h = runtime.active;
      if (!h) return actual.useState(initial);
      const slot = (h.slots[h.cursor++] ??= { value: initial });
      return [
        slot.value,
        (next: unknown) => {
          slot.value = typeof next === "function" ? next(slot.value) : next;
        },
      ];
    },
    useEffect: (...args: Parameters<typeof actual.useEffect>) => {
      if (!runtime.active) actual.useEffect(...args);
    },
    useSyncExternalStore: (
      ...args: Parameters<typeof actual.useSyncExternalStore>
    ) => (runtime.active ? args[2]?.() : actual.useSyncExternalStore(...args)),
  };
});
import { Sidebar } from "./sidebar";

type Props = {
  children?: ReactNode;
  className?: string;
  href?: string;
  "aria-current"?: string;
  "data-highlighted"?: boolean;
  "data-expanded"?: boolean;
  onPointerEnter?: (event: { pointerType: string }) => void;
  onPointerLeave?: (event?: unknown) => void;
  onPointerCancel?: () => void;
  onFocusCapture?: () => void;
  onClick?: () => void;
};
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function mount() {
  const h: Harness = { slots: [], cursor: 0 };
  function render() {
    h.cursor = 0;
    runtime.active = h;
    try {
      return elements(Sidebar({ profile: demoQuestionBank.profile }));
    } finally {
      runtime.active = null;
    }
  }
  return {
    render,
    item: (href: string) =>
      render().find(
        (e) =>
          e.props.href === href &&
          e.props.className?.split(" ").includes("nav-item"),
      )!,
    aside: () => render().find((e) => e.props.className === "sidebar")!,
    highlights: () =>
      render()
        .filter((e) => e.props["data-highlighted"])
        .map((e) => e.props.href),
    active: () =>
      render()
        .filter(
          (e) =>
            e.props.className?.split(" ").includes("nav-item") &&
            e.props["aria-current"] === "page",
        )
        .map((e) => e.props.href),
  };
}
beforeEach(() => {
  route.pathname = "/app";
});
afterEach(() => {
  runtime.active = null;
  vi.unstubAllGlobals();
});

describe("exclusive sidebar visual highlight", () => {
  it.each(["/app", "/mock-tests", "/vocabulary", "/leaderboard", "/analytics"])(
    "initializes only the actual route %s",
    (pathname) => {
      route.pathname = pathname;
      const h = mount();
      expect(h.highlights()).toEqual([pathname]);
      expect(h.active()).toEqual([pathname]);
      const html = renderToStaticMarkup(
        <Sidebar profile={demoQuestionBank.profile} />,
      );
      expect(html.match(/data-highlighted="true"/g)).toHaveLength(1);
    },
  );
  it("transfers to every eligible link without changing actual active semantics", () => {
    const h = mount();
    for (const href of [
      "/mock-tests",
      "/vocabulary",
      "/leaderboard",
      "/analytics",
      "/contact",
      "/earn",
    ]) {
      h.item(href).props.onPointerEnter?.({ pointerType: "mouse" });
      expect(h.highlights()).toEqual([href]);
      expect(h.active()).toEqual(["/app"]);
      expect(route.pathname).toBe("/app");
      h.item(href).props.onPointerLeave?.();
      expect(h.highlights()).toEqual(["/app"]);
    }
  });
  it("does not let a late leave event clear the newer hover during rapid movement", () => {
    const h = mount();
    h.item("/mock-tests").props.onPointerEnter?.({ pointerType: "mouse" });
    h.item("/vocabulary").props.onPointerEnter?.({ pointerType: "mouse" });
    h.item("/mock-tests").props.onPointerLeave?.();
    expect(h.highlights()).toEqual(["/vocabulary"]);
    h.item("/vocabulary").props.onPointerCancel?.();
    expect(h.highlights()).toEqual(["/app"]);
  });
  it("restores the new active route after navigation instead of the old route", () => {
    const h = mount();
    h.item("/mock-tests").props.onPointerEnter?.({ pointerType: "mouse" });
    h.item("/mock-tests").props.onClick?.();
    route.pathname = "/mock-tests";
    expect(h.active()).toEqual(["/mock-tests"]);
    h.item("/mock-tests").props.onPointerLeave?.();
    expect(h.highlights()).toEqual(["/mock-tests"]);
    h.item("/analytics").props.onPointerEnter?.({ pointerType: "mouse" });
    h.item("/analytics").props.onPointerLeave?.();
    expect(h.highlights()).toEqual(["/mock-tests"]);
  });
  it("keeps expansion separate and restores the route when leaving the whole sidebar", () => {
    vi.stubGlobal("Node", class {});
    const h = mount();
    h.aside().props.onPointerEnter?.({ pointerType: "mouse" });
    h.item("/vocabulary").props.onPointerEnter?.({ pointerType: "mouse" });
    expect(h.aside().props["data-expanded"]).toBe(true);
    expect(h.highlights()).toEqual(["/vocabulary"]);
    h.aside().props.onPointerLeave?.({
      relatedTarget: null,
      currentTarget: { contains: () => false },
    });
    expect(h.aside().props["data-expanded"]).toBe(false);
    expect(h.highlights()).toEqual(["/app"]);
  });
  it("does not latch a hover on touch or change the route highlight on keyboard focus", () => {
    const h = mount();
    h.item("/mock-tests").props.onPointerEnter?.({ pointerType: "touch" });
    h.aside().props.onFocusCapture?.();
    expect(h.highlights()).toEqual(["/app"]);
    expect(h.active()).toEqual(["/app"]);
  });
});
