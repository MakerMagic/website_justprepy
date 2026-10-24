import { afterEach, describe, expect, it, vi } from "vitest";
import {
  accountDisclosureOrigin,
  accountDisclosureTiming,
  animateAccountDisclosure,
} from "./account-disclosure";

describe("account disclosure anchor transform", () => {
  it.each([
    {
      name: "expanded rail",
      anchor: { left: 12, right: 242, top: 650, bottom: 714 },
      panel: { left: 250, right: 554, top: 436, bottom: 714 },
    },
    {
      name: "collapsed rail",
      anchor: { left: 12, right: 58, top: 650, bottom: 714 },
      panel: { left: 66, right: 370, top: 436, bottom: 714 },
    },
    {
      name: "mobile sheet",
      anchor: { left: 12, right: 244, top: 680, bottom: 744 },
      panel: { left: 43, right: 347, top: 394, bottom: 672 },
    },
  ])(
    "maps the panel back onto its real trigger for $name",
    ({ anchor, panel }) => {
      const transform = accountDisclosureOrigin(anchor, panel);
      const numbers = [...transform.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) =>
        Number(match[0]),
      );
      const [dx, dy, sx, sy] = numbers;
      expect(panel.left + dx).toBeCloseTo(anchor.left);
      expect(panel.top + dy).toBeCloseTo(anchor.top);
      expect((panel.right - panel.left) * sx).toBeCloseTo(
        anchor.right - anchor.left,
      );
      expect((panel.bottom - panel.top) * sy).toBeCloseTo(
        anchor.bottom - anchor.top,
      );
    },
  );
  it("does not emit invalid transforms for an unmeasurable panel", () => {
    expect(
      accountDisclosureOrigin(
        { left: 0, right: 44, top: 0, bottom: 44 },
        { left: 0, right: 0, top: 0, bottom: 0 },
      ),
    ).toBe("none");
  });
});

describe("reduced-motion disclosure", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("cancels previous motion and opens without starting scripted animations", () => {
    vi.stubGlobal("window", { matchMedia: () => ({ matches: true }) });
    vi.stubGlobal("getComputedStyle", () => ({
      transform: "none",
      opacity: "1",
    }));
    const animate = vi.fn(),
      cancel = vi.fn();
    const panel = {
      querySelectorAll: () => [],
      animate,
    } as unknown as HTMLElement;
    const trigger = {} as HTMLElement;
    expect(
      animateAccountDisclosure(panel, trigger, true, [
        { cancel } as unknown as Animation,
      ]),
    ).toEqual([]);
    expect(cancel).toHaveBeenCalledOnce();
    expect(animate).not.toHaveBeenCalled();
  });
});

describe("four-stage account reveal", () => {
  it("gives each section a distinct start and enough time to settle without a long wait", () => {
    const stages = [0, 1, 2, 3].map((stage) =>
      accountDisclosureTiming(stage, true, 560),
    );
    for (let stage = 1; stage < stages.length; stage++)
      expect(
        stages[stage].delay - stages[stage - 1].delay,
      ).toBeGreaterThanOrEqual(70);
    expect(stages.every((stage) => stage.duration >= 300)).toBe(true);
    expect(stages[3].delay + stages[3].duration).toBeLessThan(750);
  });
  it("closes in reverse order while keeping dismissal responsive", () => {
    const stages = [0, 1, 2, 3].map((stage) =>
      accountDisclosureTiming(stage, false, 560),
    );
    expect(stages[3].delay).toBe(0);
    expect(stages[2].delay).toBeLessThan(stages[1].delay);
    expect(stages[1].delay).toBeLessThan(stages[0].delay);
    expect(
      Math.max(...stages.map((stage) => stage.delay + stage.duration)),
    ).toBeLessThan(300);
  });
});
