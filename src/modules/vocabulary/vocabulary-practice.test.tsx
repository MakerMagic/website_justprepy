import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
type Harness = {
  slots: { value?: unknown; current?: unknown }[];
  cursor: number;
};
const runtime = vi.hoisted(() => ({ active: null as Harness | null }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (!runtime.active) return actual.useState(initial);
      const h = runtime.active,
        s = (h.slots[h.cursor++] ??= {
          value: typeof initial === "function" ? initial() : initial,
        });
      return [
        s.value,
        (n: unknown) => {
          s.value = typeof n === "function" ? n(s.value) : n;
        },
      ];
    },
    useReducer: (
      r: (s: unknown, a: unknown) => unknown,
      arg: unknown,
      init: (a: unknown) => unknown,
    ) => {
      const h = runtime.active!,
        s = (h.slots[h.cursor++] ??= { value: init(arg) });
      return [
        s.value,
        (a: unknown) => {
          s.value = r(s.value, a);
        },
      ];
    },
    useRef: (current: unknown) => {
      const h = runtime.active!;
      return (h.slots[h.cursor++] ??= { current });
    },
    useEffect: () => {},
  };
});
vi.mock("react-dom", async (original) => ({
  ...(await original<typeof import("react-dom")>()),
  flushSync: (fn: () => unknown) => fn(),
}));
import { VocabularyPractice } from "./vocabulary-practice";
import {
  VocabularyPracticeSummary,
  VocabularyBookmark,
} from "./vocabulary-practice-summary";
import { practiceQueue } from "./vocabulary-practice-state";
import { vocabularyWordsReducer, isWordSaved } from "./vocabulary-words";
import { createDemoWordState } from "./vocabulary-words.fixtures";
import { Vocabulary, VocabularyPresetCard } from "./vocabulary";
import { VocabularyInspector } from "./vocabulary-inspector";
import { demoVocabulary } from "./vocabulary.fixtures";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
type Props = {
  children?: ReactNode;
  className?: string;
  ref?: { current: unknown };
  inert?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  onClick?: () => unknown;
};
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  return isValidElement<Props>(node)
    ? [node, ...elements(node.props.children)]
    : [];
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return isValidElement<Props>(node) ? text(node.props.children) : "";
}
const initial = () =>
  createDemoWordState(demoVocabulary.presets.map((p) => p.id));
function mountPractice(reduce = false) {
  const h: Harness = { slots: [], cursor: 0 };
  let words = initial();
  const entries = practiceQueue(words, ["nuet-core"]).slice(0, 2);
  const onExit = vi.fn(),
    onExclude = vi.fn();
  const records: {
    frames: Keyframe[];
    options: KeyframeAnimationOptions;
    cancel: ReturnType<typeof vi.fn>;
  }[] = [];
  const slot = {
    animate: (frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const cancel = vi.fn();
      records.push({ frames, options, cancel });
      return {
        cancel,
        finished: new Promise<void>((resolve) =>
          setTimeout(resolve, Number(options.duration)),
        ),
      };
    },
  };
  const card = { style: { transition: "" }, offsetWidth: 100 };
  vi.stubGlobal("window", {
    matchMedia: () => ({ matches: reduce }),
    scrollTo: vi.fn(),
  });
  function render() {
    h.cursor = 0;
    runtime.active = h;
    const tree = VocabularyPractice({
      entries,
      words,
      onSave: (entry, saved) => {
        words = vocabularyWordsReducer(words, {
          type: "save-word",
          key: entry.key,
          word: entry.word,
          saved,
        });
      },
      onExclude,
      onExit,
    });
    runtime.active = null;
    const nodes = elements(tree);
    for (const n of nodes) {
      if (n.props.className === "vpr-slot" && n.props.ref)
        n.props.ref.current = slot;
      if (n.props.className?.startsWith("vpr-card") && n.props.ref)
        n.props.ref.current = card;
    }
    return nodes;
  }
  const button = (label: string) =>
    render().find(
      (n) =>
        n.props["aria-label"] === label ||
        (n.type === "button" && text(n) === label),
    )!;
  const summary = () =>
    render().find((n) => n.type === VocabularyPracticeSummary)! as ReactElement<
      Parameters<typeof VocabularyPracticeSummary>[0]
    >;
  return {
    render,
    button,
    summary,
    records,
    onExit,
    onExclude,
    words: () => words,
    entries,
  };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  runtime.active = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("reference practice interactions and motion", () => {
  it("reveals self-assessment only after flipping and preserves boundary arrows", () => {
    const app = mountPractice();
    expect(app.button("Previous word").props.disabled).toBe(true);
    expect(
      app.render().find((n) => n.props.className?.startsWith("vpr-answers"))
        ?.props.inert,
    ).toBe(true);
    app.button("Show meaning").props.onClick!();
    expect(app.button("Show meaning").props.inert).toBe(true);
    expect(
      app.render().find((n) => n.props.className?.startsWith("vpr-answers"))
        ?.props.inert,
    ).toBe(false);
  });
  it("matches outgoing 150ms/incoming 230ms motion, 28px direction and the source busy guard", async () => {
    const app = mountPractice();
    void app.button("Next word").props.onClick!();
    expect(app.records[0]).toMatchObject({
      frames: [
        { opacity: 1, transform: "translateX(0)" },
        { opacity: 0, transform: "translateX(-28px)" },
      ],
      options: { duration: 150, easing: "ease-in", fill: "forwards" },
    });
    app.button("Finish").props.onClick!();
    expect(app.summary()).toBeUndefined();
    await vi.advanceTimersByTimeAsync(149);
    expect(text(app.render().find((n) => n.props.className === "vpr-w"))).toBe(
      "diligent",
    );
    await vi.advanceTimersByTimeAsync(1);
    expect(text(app.render().find((n) => n.props.className === "vpr-w"))).toBe(
      "obsolete",
    );
    expect(app.records[1]).toMatchObject({
      frames: [
        { opacity: 0, transform: "translateX(28px)" },
        { opacity: 1, transform: "translateX(0)" },
      ],
      options: { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" },
    });
    await vi.advanceTimersByTimeAsync(230);
    expect(app.records.every((r) => r.cancel.mock.calls.length === 1)).toBe(
      true,
    );
    app.button("Finish").props.onClick!();
    expect(app.summary().props.reviewed).toBe(0);
  });
  it("implements self-assessment, Save All, retrying missed words and Exit", async () => {
    const app = mountPractice();
    app.button("Show meaning").props.onClick!();
    app.button("I did not know it").props.onClick!();
    await vi.advanceTimersByTimeAsync(380);
    app.button("Show meaning").props.onClick!();
    app.button("I knew it").props.onClick!();
    expect(app.summary().props.reviewed).toBe(2);
    expect(app.summary().props.missed).toEqual([app.entries[0]]);
    app.summary().props.onSaveAll();
    expect(isWordSaved(app.words(), app.entries[0].key)).toBe(true);
    expect(
      renderToStaticMarkup(
        <VocabularyPracticeSummary {...app.summary().props} />,
      ),
    ).toContain("All in My Words");
    app.summary().props.onRedo();
    expect(app.button("Next word").props.disabled).toBe(true);
    app.button("Show meaning").props.onClick!();
    app.button("I knew it").props.onClick!();
    expect(app.summary().props.missed).toEqual([]);
    expect(
      renderToStaticMarkup(
        <VocabularyPracticeSummary {...app.summary().props} />,
      ),
    ).not.toContain("Go over");
    app.summary().props.onExit();
    expect(app.onExit).toHaveBeenCalledOnce();
  });
  it("keeps never-show behavior and skips slide animation under reduced motion", () => {
    const app = mountPractice(true);
    app.button("Show meaning").props.onClick!();
    app.button("Never show me this again").props.onClick!();
    expect(app.onExclude).toHaveBeenCalledWith(app.entries[0]);
    expect(text(app.render().find((n) => n.props.className === "vpr-w"))).toBe(
      "obsolete",
    );
    expect(app.records).toEqual([]);
  });
  it("individual bookmarks update My Words without flipping the card back", () => {
    const app = mountPractice();
    app.button("Show meaning").props.onClick!();
    let bookmark = app
      .render()
      .find((n) => n.type === VocabularyBookmark)! as ReactElement<
      Parameters<typeof VocabularyBookmark>[0]
    >;
    bookmark.props.onToggle(bookmark.props.entry);
    bookmark = app
      .render()
      .find((n) => n.type === VocabularyBookmark)! as typeof bookmark;
    expect(bookmark.props.saved).toBe(true);
    expect(bookmark.props.pulse).toBe(1);
    expect(app.button("Show meaning").props.inert).toBe(true);
    bookmark.props.onToggle(bookmark.props.entry);
    expect(isWordSaved(app.words(), app.entries[0].key)).toBe(false);
  });
  it("retains reference sizes/motion and keeps root CSS away from the landing Practice button", () => {
    const css = readFileSync(
      new URL("./vocabulary-practice.css", import.meta.url),
      "utf8",
    );
    expect(css).toContain("height: clamp(300px, 48vh, 400px)");
    expect(css).toContain("transform 0.6s cubic-bezier(0.3, 0.7, 0.2, 1)");
    expect(css).toContain(
      "animation: vpr-pop 0.32s cubic-bezier(0.3, 1.6, 0.5, 1)",
    );
    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("font: 400 16px/1.5 var(--font-ui)");
    expect(css).not.toMatch(/\.vocabulary-practice\s*\{/);
  });
});
describe("existing Vocabulary integration", () => {
  it("uses shared inspector data and selected presets, returning without losing selection", () => {
    const h: Harness = { slots: [], cursor: 0 };
    function render() {
      h.cursor = 0;
      runtime.active = h;
      const tree = Vocabulary({
        data: demoVocabulary,
        profile: demoQuestionBank.profile,
        telegramUrl: null,
      });
      runtime.active = null;
      return elements(tree);
    }
    const core = render().find(
      (n) =>
        n.type === VocabularyPresetCard &&
        (n.props as { preset?: { id: string } }).preset?.id === "nuet-core",
    )! as ReactElement<Parameters<typeof VocabularyPresetCard>[0]>;
    core.props.onSelect("nuet-core");
    const inspector = render().find(
      (n) => n.type === VocabularyInspector,
    )! as ReactElement<Parameters<typeof VocabularyInspector>[0]>;
    inspector.props.dispatch({
      type: "add",
      presetId: "my-words",
      id: "custom-practice",
      word: "custom word",
      meaning: "custom meaning",
    });
    render().find(
      (n) =>
        n.type === "button" &&
        n.props.className === "button vocabulary-practice",
    )!.props.onClick!();
    let screen = render().find(
      (n) => n.type === VocabularyPractice,
    )! as ReactElement<Parameters<typeof VocabularyPractice>[0]>;
    expect(screen.props.entries).toHaveLength(16);
    expect(
      screen.props.entries.some((e) => e.word.id === "custom-practice"),
    ).toBe(true);
    expect(screen.props.entries.some((e) => e.word.id === "ambiguous")).toBe(
      false,
    );
    const builtIn = screen.props.entries.find((e) => e.word.id === "diligent")!;
    screen.props.onSave(builtIn, true);
    screen = render().find(
      (n) => n.type === VocabularyPractice,
    )! as typeof screen;
    expect(isWordSaved(screen.props.words, builtIn.key)).toBe(true);
    screen.props.onExit();
    const nodes = render();
    expect(
      nodes.some(
        (n) => n.props.className === "bank-content vocabulary-content",
      ),
    ).toBe(true);
    expect(nodes.some((n) => n.type === VocabularyPractice)).toBe(false);
    const presets = nodes.filter(
      (n) => n.type === VocabularyPresetCard,
    ) as ReactElement<Parameters<typeof VocabularyPresetCard>[0]>[];
    expect(presets.map((p) => p.props.selected)).toEqual([true, true, false]);
  });
});
