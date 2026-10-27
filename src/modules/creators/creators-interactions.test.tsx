import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isValidElement,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

type Slot = {
  current?: unknown;
  value?: unknown;
  deps?: unknown[];
  cleanup?: () => void;
};
type Harness = { slots: Slot[]; cursor: number; effects: (() => void)[] };
const runtime = vi.hoisted(() => ({ active: null as Harness | null }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useRef: (current: unknown) => {
      const h = runtime.active!;
      return (h.slots[h.cursor++] ??= { current });
    },
    useState: (value: unknown) => {
      const h = runtime.active!;
      const slot = (h.slots[h.cursor++] ??= { value });
      return [
        slot.value,
        (next: unknown) => {
          slot.value = next;
        },
      ];
    },
    useEffect: (effect: () => (() => void) | void, deps: unknown[]) => {
      const h = runtime.active!;
      const slot = (h.slots[h.cursor++] ??= {});
      if (
        !slot.deps ||
        deps.some((value, i) => !Object.is(value, slot.deps![i]))
      ) {
        h.effects.push(() => {
          slot.cleanup?.();
          slot.cleanup = effect() || undefined;
        });
        slot.deps = deps;
      }
    },
  };
});

import { CreatorsCommission } from "./creators-commission";
import { observeCreatorsReveals } from "./creators-motion";

type Props = {
  children?: ReactNode;
  role?: string;
  id?: string;
  className?: string;
  tabIndex?: number;
  "aria-selected"?: boolean;
  onClick?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  ref?: (node: HTMLButtonElement) => void;
};
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}
const mounts: Harness[] = [];
function mountCommission() {
  const harness: Harness = { slots: [], cursor: 0, effects: [] };
  mounts.push(harness);
  const focus = [vi.fn(), vi.fn()];
  let tree: ReactElement;
  function render() {
    harness.cursor = 0;
    runtime.active = harness;
    tree = CreatorsCommission();
    harness.effects.splice(0).forEach((effect) => effect());
    const tabs = elements(tree).filter((e) => e.props.role === "tab");
    tabs.forEach((tab, i) =>
      tab.props.ref?.({ focus: focus[i] } as unknown as HTMLButtonElement),
    );
    return {
      tabs,
      panel: elements(tree).find((e) => e.props.role === "tabpanel")!,
      number: elements(tree).find((e) => e.props.id === "n")!.props.children,
      description: elements(tree).find((e) => e.props.id === "d")!.props
        .children,
      example: elements(tree).find((e) => e.props.id === "e"),
    };
  }
  return {
    render,
    focus,
    unmount: () => harness.slots.forEach((slot) => slot.cleanup?.()),
  };
}
beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  mounts.splice(0).forEach((h) => h.slots.forEach((slot) => slot.cleanup?.()));
  runtime.active = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("source commission interactions", () => {
  it("selects immediately, preserves the old figure through 179ms and changes all figure copy at 180ms", () => {
    const app = mountCommission();
    app.render().tabs[1].props.onClick!();
    let view = app.render();
    expect(view.tabs.map((tab) => tab.props["aria-selected"])).toEqual([
      false,
      true,
    ]);
    expect(view.tabs.map((tab) => tab.props.tabIndex)).toEqual([-1, 0]);
    expect(view.panel.props.className).toBe("fig sw");
    expect(view.number).toBe("20%");
    expect(view.example).toBeUndefined();
    vi.advanceTimersByTime(179);
    expect(app.render().number).toBe("20%");
    vi.advanceTimersByTime(1);
    view = app.render();
    expect(view.panel.props.className).toBe("fig");
    expect(view.number).toBe("10%");
    expect(view.description).toBe(
      "Commission on subscriptions bought with the promo codes of creators you recruited into the program.",
    );
    expect(view.example).toBeUndefined();
  });

  it("keeps source ArrowRight/ArrowLeft selection, wraparound and focus movement", () => {
    const app = mountCommission();
    const preventDefault = vi.fn();
    app.render().tabs[0].props.onKeyDown!({
      key: "ArrowRight",
      preventDefault,
    } as unknown as KeyboardEvent<HTMLButtonElement>);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(app.focus[1]).toHaveBeenCalledOnce();
    let view = app.render();
    expect(view.tabs[1].props.tabIndex).toBe(0);
    view.tabs[1].props.onKeyDown!({
      key: "ArrowLeft",
      preventDefault,
    } as unknown as KeyboardEvent<HTMLButtonElement>);
    expect(app.focus[0]).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(180);
    view = app.render();
    expect(view.number).toBe("20%");
    expect(view.tabs.map((tab) => tab.props["aria-selected"])).toEqual([
      true,
      false,
    ]);
  });

  it("preserves rapid-click ordering and cancels every pending update on navigation/unmount", () => {
    const app = mountCommission();
    app.render().tabs[1].props.onClick!();
    vi.advanceTimersByTime(40);
    app.render().tabs[0].props.onClick!();
    vi.advanceTimersByTime(180);
    expect(app.render().number).toBe("20%");
    app.render().tabs[1].props.onClick!();
    app.render().tabs[0].props.onClick!();
    expect(vi.getTimerCount()).toBe(2);
    app.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

function revealFixture() {
  const classes = () => {
    const values = new Set<string>();
    return {
      add: (v: string) => {
        values.add(v);
      },
      remove: (v: string) => {
        values.delete(v);
      },
      contains: (v: string) => values.has(v),
    };
  };
  const targets = Array.from({ length: 7 }, () => ({
    classList: classes(),
    style: {
      transitionDelay: "",
      removeProperty() {
        this.transitionDelay = "";
      },
    },
  }));
  const rootClasses = classes();
  const root = {
    classList: rootClasses,
    querySelectorAll: () => targets,
  } as unknown as HTMLElement;
  const observe = vi.fn(),
    unobserve = vi.fn(),
    disconnect = vi.fn(),
    construct = vi.fn();
  let notify: IntersectionObserverCallback = () => {};
  class Observer {
    constructor(
      callback: IntersectionObserverCallback,
      options: IntersectionObserverInit,
    ) {
      notify = callback;
      construct(options);
    }
    observe = observe;
    unobserve = unobserve;
    disconnect = disconnect;
  }
  let sequence = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.stubGlobal("window", {
    IntersectionObserver: Observer,
    requestAnimationFrame: (callback: FrameRequestCallback) => {
      frames.set(++sequence, callback);
      return sequence;
    },
    cancelAnimationFrame: (id: number) => {
      frames.delete(id);
    },
  });
  return {
    root,
    rootClasses,
    targets,
    observe,
    unobserve,
    disconnect,
    construct,
    frames,
    frame: () => {
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach((f) => f(0));
    },
    notify: (index: number, isIntersecting: boolean) =>
      notify(
        [
          {
            target: targets[index],
            isIntersecting,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      ),
  };
}
describe("source reveal sequence", () => {
  it("paints its starting state before observing all seven elements with the original threshold and cyclic delays", () => {
    const f = revealFixture(),
      stop = observeCreatorsReveals(f.root);
    expect(f.construct).toHaveBeenCalledWith({ threshold: 0.12 });
    expect(f.targets.map((e) => e.style.transitionDelay)).toEqual([
      "0ms",
      "70ms",
      "140ms",
      "210ms",
      "0ms",
      "70ms",
      "140ms",
    ]);
    expect(f.rootClasses.contains("creators-reveal-ready")).toBe(true);
    expect(f.observe).not.toHaveBeenCalled();
    f.frame();
    expect(f.observe).not.toHaveBeenCalled();
    f.frame();
    expect(f.observe).toHaveBeenCalledTimes(7);
    f.notify(0, false);
    expect(f.targets[0].classList.contains("in")).toBe(false);
    f.notify(0, true);
    expect(f.targets[0].classList.contains("in")).toBe(true);
    expect(f.unobserve).toHaveBeenCalledExactlyOnceWith(f.targets[0]);
    stop?.();
  });

  it("cleans queued frames and observer state on unmount and safely replays the mount", () => {
    const f = revealFixture(),
      stop = observeCreatorsReveals(f.root);
    f.frame();
    stop?.();
    f.frame();
    expect(f.frames.size).toBe(0);
    expect(f.observe).not.toHaveBeenCalled();
    expect(f.disconnect).toHaveBeenCalledOnce();
    f.notify(1, true);
    expect(f.targets[1].classList.contains("in")).toBe(false);
    const stopAgain = observeCreatorsReveals(f.root);
    f.frame();
    f.frame();
    f.notify(2, true);
    stopAgain?.();
    expect(
      f.targets.every(
        (e) => !e.classList.contains("in") && !e.style.transitionDelay,
      ),
    ).toBe(true);
    expect(f.rootClasses.contains("creators-reveal-ready")).toBe(false);
  });

  it("keeps the page visible when IntersectionObserver is unavailable", () => {
    const f = revealFixture();
    vi.stubGlobal("window", {});
    expect(observeCreatorsReveals(f.root)).toBeUndefined();
    expect(f.rootClasses.contains("creators-reveal-ready")).toBe(false);
    expect(f.frames.size).toBe(0);
  });
});
