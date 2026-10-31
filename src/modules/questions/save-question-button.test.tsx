import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import type { ComponentProps, ReactElement } from "react";

// Exercise the real component's effects and event handlers without adding a DOM framework.
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
    useRef: (value: unknown) => {
      const h = runtime.active!;
      return (h.slots[h.cursor++] ??= { current: value });
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

const lottie = vi.hoisted(() => ({ loadAnimation: vi.fn() }));
vi.mock("lottie-web", () => ({ default: lottie }));
import { SaveQuestionButton } from "./save-question-button";
import {
  emptyPracticeResponse,
  updatePracticeResponse,
} from "./practice.logic";

type Props = ComponentProps<typeof SaveQuestionButton>;
type Button = ReactElement<{
  onClick: () => Promise<void>;
  disabled: boolean;
  "aria-pressed": boolean;
  "aria-busy": boolean;
  children: ReactElement[];
}>;
const mounted: Harness[] = [];
let reduce = false;
let motionChange: (() => void) | undefined;
let animations: ReturnType<typeof makeAnimation>[];
function makeAnimation() {
  return {
    isLoaded: true,
    goToAndPlay: vi.fn(),
    goToAndStop: vi.fn(),
    destroy: vi.fn(),
    addEventListener: vi.fn(),
  };
}
function mount(initial: Props) {
  const h: Harness = { slots: [], cursor: 0, effects: [] };
  mounted.push(h);
  let props = initial;
  let button: Button;
  function render(update: Partial<Props> = {}) {
    props = { ...props, ...update };
    h.cursor = 0;
    runtime.active = h;
    button = SaveQuestionButton(props) as Button;
    h.slots[0].current = {};
    h.effects.splice(0).forEach((effect) => effect());
    return button;
  }
  render();
  return { render, click: () => button.props.onClick() };
}
async function loaded() {
  await vi.dynamicImportSettled();
}
beforeEach(() => {
  reduce = false;
  animations = [];
  lottie.loadAnimation.mockImplementation(() => {
    const a = makeAnimation();
    animations.push(a);
    return a;
  });
  vi.stubGlobal("window", {
    matchMedia: () => ({
      matches: reduce,
      addEventListener: (_: string, fn: () => void) => {
        motionChange = fn;
      },
      removeEventListener: vi.fn(),
    }),
  });
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ ip: 0, op: 50 }) }),
  );
});
afterEach(() => {
  mounted.splice(0).forEach((h) => h.slots.forEach((s) => s.cleanup?.()));
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("shared animated question bookmark", () => {
  it("uses the supplied asset with its original frame rate, colors and one-shot configuration", async () => {
    const asset = JSON.parse(
      readFileSync("public/animations/bookmark.json", "utf8"),
    );
    expect(asset).toMatchObject({
      nm: "bookmark",
      fr: 30,
      ip: 0,
      op: 50,
      w: 200,
      h: 200,
    });
    mount({ saved: false, onToggle: () => true });
    await loaded();
    expect(fetch).toHaveBeenCalledWith(
      "/animations/bookmark.json",
      expect.anything(),
    );
    expect(lottie.loadAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        autoplay: false,
        loop: false,
        renderer: "svg",
      }),
    );
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(0, true);
    expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
  });
  it("plays once only after successful saving, not on rerenders", async () => {
    let finish!: (saved: boolean) => void;
    const toggle = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          finish = resolve;
        }),
    );
    const h = mount({ saved: false, onToggle: toggle });
    await loaded();
    const request = h.click();
    expect(h.render().props.disabled).toBe(true);
    expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
    await h.click();
    expect(toggle).toHaveBeenCalledTimes(1);
    finish(true);
    await request;
    const staticCalls = animations[0].goToAndStop.mock.calls.length;
    h.render({ saved: true });
    h.render();
    expect(animations[0].goToAndPlay).toHaveBeenCalledTimes(1);
    expect(animations[0].goToAndStop).toHaveBeenCalledTimes(staticCalls);
    expect(h.render().props["aria-pressed"]).toBe(true);
  });
  it("does not replay on opening an already saved question", async () => {
    mount({ saved: true, onToggle: () => false });
    await loaded();
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(49, true);
    expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
  });
  it("unsaves to the static initial frame", async () => {
    const h = mount({ saved: true, onToggle: async () => false });
    await loaded();
    await h.click();
    h.render({ saved: false });
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(0, true);
    expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
  });
  it.each([false, true])(
    "keeps saved=%s unchanged when a mutation fails",
    async (saved) => {
      const h = mount({
        saved,
        onToggle: async () => {
          throw new Error("offline");
        },
      });
      await loaded();
      await h.click();
      const button = h.render();
      expect(button.props["aria-pressed"]).toBe(saved);
      expect(button.props.disabled).toBe(false);
      expect(
        (button.props.children[2] as ReactElement<{ children: string }>).props
          .children,
      ).toContain("Could not");
      expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
    },
  );
  it("uses static frames for reduced motion and stops when the preference changes", async () => {
    reduce = true;
    const h = mount({ saved: false, onToggle: async () => true });
    await loaded();
    await h.click();
    h.render({ saved: true });
    expect(animations[0].goToAndPlay).not.toHaveBeenCalled();
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(49, true);
    motionChange?.();
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(49, true);
  });
  it("shares saved state across solver, review and question navigation without touching attempts", async () => {
    let responses = updatePracticeResponse({}, "q1", {});
    const toggle = async () => {
      const saved = !responses.q1.saved;
      responses = updatePracticeResponse(responses, "q1", { saved });
      return saved;
    };
    const main = mount({ saved: false, onToggle: toggle });
    await loaded();
    const review = mount({ saved: false, onToggle: toggle });
    await loaded();
    await vi.waitFor(() => expect(animations).toHaveLength(2));
    await main.click();
    expect(
      review.render({ saved: responses.q1.saved }).props["aria-pressed"],
    ).toBe(true);
    expect(animations[1].goToAndPlay).not.toHaveBeenCalled();
    await review.click();
    expect(
      main.render({ saved: responses.q1.saved }).props["aria-pressed"],
    ).toBe(false);
    responses = updatePracticeResponse(responses, "q2", { selected: "A" });
    expect(responses.q1).toEqual(emptyPracticeResponse);
  });
  it("preserves native button semantics and respects pending state", async () => {
    const toggle = vi.fn();
    const h = mount({ saved: false, pending: true, onToggle: toggle });
    await loaded();
    await h.click();
    expect(h.render().type).toBe("button");
    expect(h.render().props["aria-busy"]).toBe(true);
    expect(h.render().props.disabled).toBe(true);
    expect(toggle).not.toHaveBeenCalled();
  });
  it("destroys players on unmount", async () => {
    mount({ saved: false, onToggle: () => true });
    await loaded();
    mounted[0].slots.forEach((s) => s.cleanup?.());
    expect(animations[0].destroy).toHaveBeenCalled();
  });
  it("stops an active animation when reduced motion is enabled", async () => {
    const media = {
      matches: false,
      addEventListener: (_: string, fn: () => void) => {
        motionChange = fn;
      },
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal("window", { matchMedia: () => media });
    const h = mount({ saved: false, onToggle: () => true });
    await loaded();
    await h.click();
    h.render({ saved: true });
    expect(animations[0].goToAndPlay).toHaveBeenCalledTimes(1);
    media.matches = true;
    motionChange?.();
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(49, true);
    h.render();
    expect(animations[0].goToAndPlay).toHaveBeenCalledTimes(1);
  });
  it("keeps the existing icon usable when the animation asset fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("asset unavailable"));
    const toggle = vi.fn(() => true);
    const h = mount({ saved: false, onToggle: toggle });
    await loaded();
    await h.click();
    expect(toggle).toHaveBeenCalledTimes(1);
    expect(lottie.loadAnimation).not.toHaveBeenCalled();
    expect(h.render({ saved: true }).props.children[1]).toBeTruthy();
  });
  it("uses the same player and saved state for word actions with contextual accessible labels", async () => {
    const labels = {
      save: "Save lucid to My Words",
      remove: "Remove lucid from My Words",
      saveError: "Could not save word.",
      removeError: "Could not remove saved word.",
    };
    const action = vi.fn(() => true);
    const h = mount({ saved: false, labels, onToggle: action });
    await loaded();
    expect(h.render().props).toMatchObject({ "aria-label": labels.save });
    await h.click();
    expect(action).toHaveBeenCalledTimes(1);
    expect(animations[0].goToAndPlay).toHaveBeenCalledWith(0, true);
    expect(h.render({ saved: true }).props).toMatchObject({
      "aria-label": labels.remove,
      "aria-pressed": true,
    });
  });
  it("disables unavailable-content bookmarks without claiming an operation is pending", async () => {
    const onToggle = vi.fn();
    const h = mount({ saved: false, disabled: true, onToggle });
    await loaded();
    await h.click();
    expect(h.render().props.disabled).toBe(true);
    expect(h.render().props["aria-busy"]).toBe(false);
    expect(onToggle).not.toHaveBeenCalled();
  });
});
