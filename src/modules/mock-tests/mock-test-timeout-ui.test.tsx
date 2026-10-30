import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  attemptDeadline,
  changeDemoAttempt,
  createDemoAttempt,
  demoExamQuestions,
  type DemoMockAttempt,
} from "./mock-test-attempt.logic";
import { readDemoAttempts, saveDemoAttempt } from "./mock-test-attempt.storage";
type Harness = {
  slots: { value?: unknown; current?: unknown }[];
  cursor: number;
  effects: (() => void | (() => void))[];
};
const runtime = vi.hoisted(() => ({ current: null as Harness | null }));
const route = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => route }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      const h = runtime.current;
      if (!h) return actual.useState(initial);
      const slot =
        h.slots[h.cursor++] ??
        (h.slots[h.cursor - 1] = {
          value: typeof initial === "function" ? initial() : initial,
        });
      return [
        slot.value,
        (next: unknown) => {
          slot.value = typeof next === "function" ? next(slot.value) : next;
        },
      ];
    },
    useRef: (initial: unknown) => {
      const h = runtime.current;
      return h
        ? (h.slots[h.cursor++] ??= { current: initial })
        : actual.useRef(initial);
    },
    useEffect: (...args: Parameters<typeof actual.useEffect>) => {
      if (runtime.current) runtime.current.effects.push(args[0]);
      else actual.useEffect(...args);
    },
    useCallback: <T,>(callback: T, deps: unknown[]) =>
      runtime.current ? callback : actual.useCallback(callback as never, deps),
  };
});
import { MockTestEntry, MockTestTaking } from "./mock-test-taking";
type Props = {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  open?: boolean;
  "aria-label"?: string;
};
function nodes(root: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(root)) return root.flatMap(nodes);
  if (!isValidElement<Props>(root)) return [];
  return [root, ...nodes(root.props.children)];
}
function memory(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  };
}
const full = demoMockTests[0],
  questions = demoExamQuestions(full);
let storage: Storage;
const cleanups: (() => void)[] = [];
function mount(attempt: DemoMockAttempt, entry = false) {
  const h: Harness = { slots: [], cursor: 0, effects: [] };
  function render() {
    h.cursor = 0;
    runtime.current = h;
    try {
      return nodes(
        entry
          ? MockTestEntry({ test: full, attemptId: attempt.id, retake: false })
          : MockTestTaking({ test: full, initialAttempt: attempt }),
      );
    } finally {
      runtime.current = null;
    }
  }
  const first = render();
  for (const effect of h.effects) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }
  return { render, first };
}
async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10_000_000);
  storage = memory();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("navigator", {});
  const events = new EventTarget();
  vi.stubGlobal(
    "window",
    Object.assign(events, {
      setInterval: (fn: () => void, delay: number) => setInterval(fn, delay),
      clearInterval: (timer: ReturnType<typeof setInterval>) =>
        clearInterval(timer),
      matchMedia: () => ({ matches: false }),
      scrollTo: () => {},
    }),
  );
  vi.stubGlobal("document", new EventTarget());
  vi.stubGlobal("requestAnimationFrame", () => 0);
  route.replace.mockReset();
  route.push.mockReset();
});
afterEach(() => {
  cleanups.splice(0).forEach((fn) => fn());
  runtime.current = null;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("Actual Mock Test timeout lifecycle", () => {
  it("keeps one timer across navigation and automatically submits from Mathematics without confirmation", async () => {
    const a = createDemoAttempt(
      full,
      "demo-attempt-live",
      Date.now() - full.durationMinutes * 60000 + 1500,
    );
    saveDemoAttempt(a);
    const writes = vi.spyOn(storage, "setItem");
    const ui = mount(a);
    await flush();
    expect(route.replace).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(1);
    const answer = ui
      .render()
      .find(
        (n) => n.type === "button" && n.props.className === "answer-option",
      )!;
    answer.props.onClick!();
    ui
      .render()
      .find(
        (n) => n.type === "button" && n.props["aria-label"] === "Next question",
      )!.props.onClick!();
    expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(2000);
    await flush();
    const done = readDemoAttempts(full)[0];
    expect(done.completedAt).toBe(attemptDeadline(full, a));
    expect(Object.keys(done.answers)).toHaveLength(1);
    expect(done.completedSections).toEqual([]);
    expect(route.replace).toHaveBeenCalledTimes(1);
    expect(route.replace.mock.calls[0][0]).toContain(a.id);
    expect(ui.render().find((n) => n.type === "fieldset")!.props.disabled).toBe(
      true,
    );
    await vi.advanceTimersByTimeAsync(3000);
    expect(route.replace).toHaveBeenCalledTimes(1);
    expect(
      writes.mock.calls.filter(
        ([, raw]) => JSON.parse(raw).completedAt !== null,
      ),
    ).toHaveLength(1);
    expect(done.analytics?.result?.details?.sessionId).toBe(a.id);
    expect(
      Object.values(done.analytics!.questionTimeMs).reduce(
        (sum, ms) => sum + ms,
        0,
      ),
    ).toBe(1500);
  });
  it("restoring an already expired attempt goes directly to its saved Results", async () => {
    let a = createDemoAttempt(
      full,
      "demo-attempt-resume-expired",
      Date.now() - full.durationMinutes * 60000 - 10000,
    );
    a = changeDemoAttempt(a, questions, { kind: "finish-section" });
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[30].id,
      option: "D",
    });
    saveDemoAttempt(a);
    mount(a, true);
    await flush();
    const done = readDemoAttempts(full)[0];
    expect(done.completedSections).toEqual(["math"]);
    expect(done.answers[questions[30].id]).toBe("D");
    expect(route.replace).toHaveBeenCalledWith(
      expect.stringContaining("/results?attempt=" + a.id),
    );
  });
  it("rejects a new answer at the deadline even before the next timer callback", async () => {
    const a = createDemoAttempt(
      full,
      "demo-attempt-boundary",
      Date.now() - full.durationMinutes * 60000 + 500,
    );
    saveDemoAttempt(a);
    const ui = mount(a);
    await flush();
    vi.setSystemTime(attemptDeadline(full, a));
    ui
      .render()
      .find(
        (n) => n.type === "button" && n.props.className === "answer-option",
      )!.props.onClick!();
    await flush();
    expect(readDemoAttempts(full)[0].answers).toEqual({});
    expect(readDemoAttempts(full)[0].completedAt).toBe(
      attemptDeadline(full, a),
    );
  });
  it("manual Finish and timeout share a single in-flight submission", async () => {
    let release: (() => void) | undefined;
    const request = vi.fn(
      (_key: string, callback: () => unknown) =>
        new Promise((resolve) => {
          release = () => resolve(callback());
        }),
    );
    vi.stubGlobal("navigator", { locks: { request } });
    let a = createDemoAttempt(
      full,
      "demo-attempt-race",
      Date.now() - full.durationMinutes * 60000 + 500,
    );
    a = changeDemoAttempt(a, questions, { kind: "finish-section" });
    a = changeDemoAttempt(a, questions, {
      kind: "navigate",
      id: questions.at(-1)!.id,
    });
    saveDemoAttempt(a);
    const ui = mount(a);
    await flush();
    ui.render().find((n) => n.props.className === "button mock-finish")!.props
      .onClick!();
    ui
      .render()
      .find(
        (n) =>
          n.type === "button" &&
          n.props.className === "button mock-confirm-danger",
      )!.props.onClick!();
    await vi.advanceTimersByTimeAsync(1000);
    expect(request).toHaveBeenCalledTimes(1);
    release!();
    await flush();
    expect(route.replace).toHaveBeenCalledTimes(1);
    expect(readDemoAttempts(full)).toHaveLength(1);
  });
  it("an idle timing checkpoint preserves another view's latest saved answer", async () => {
    const a = createDemoAttempt(full, "demo-attempt-shared", Date.now());
    saveDemoAttempt(a);
    mount(a);
    await flush();
    const fromAnotherView = changeDemoAttempt(
      readDemoAttempts(full)[0],
      questions,
      { kind: "answer", id: questions[0].id, option: "B" },
    );
    saveDemoAttempt(fromAnotherView);
    await vi.advanceTimersByTimeAsync(1500);
    expect(readDemoAttempts(full)[0].answers[questions[0].id]).toBe("B");
  });
});
