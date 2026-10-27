import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
type Slot = { value?: unknown; current?: unknown };
type Harness = { slots: Slot[]; cursor: number };
const runtime = vi.hoisted(() => ({ active: null as Harness | null }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: unknown) => {
      if (!runtime.active) return actual.useState(initial);
      const h = runtime.active,
        slot = (h.slots[h.cursor++] ??= {
          value: typeof initial === "function" ? initial() : initial,
        });
      return [
        slot.value,
        (next: unknown) => {
          slot.value = typeof next === "function" ? next(slot.value) : next;
        },
      ];
    },
    useReducer: (
      reducer: (s: unknown, a: unknown) => unknown,
      arg: unknown,
      init: (a: unknown) => unknown,
    ) => {
      if (!runtime.active) return actual.useReducer(reducer, arg, init);
      const h = runtime.active,
        slot = (h.slots[h.cursor++] ??= { value: init(arg) });
      return [
        slot.value,
        (action: unknown) => {
          slot.value = reducer(slot.value, action);
        },
      ];
    },
    useRef: (value: unknown) => {
      if (!runtime.active) return actual.useRef(value);
      const h = runtime.active;
      return (h.slots[h.cursor++] ??= { current: value });
    },
    useEffect: (effect: () => void, deps: unknown[]) => {
      if (!runtime.active) return actual.useEffect(effect, deps);
      // Event/state integration is exercised here; DOM effects run in browser verification.
    },
  };
});
vi.mock("react-dom", async (original) => ({
  ...(await original<typeof import("react-dom")>()),
  createPortal: (node: ReactNode) => node,
}));
import { VocabularyInspector } from "./vocabulary-inspector";
import { VocabularyWordDialog } from "./vocabulary-word-dialog";
import { demoVocabulary } from "./vocabulary.fixtures";
import { createDemoWordState } from "./vocabulary-words.fixtures";
import {
  vocabularyWordsReducer,
  type VocabularyWordAction,
} from "./vocabulary-words";

type Props = {
  children?: ReactNode;
  className?: string;
  role?: string;
  "aria-label"?: string;
  "aria-expanded"?: boolean;
  "data-word-id"?: string;
  onClick?: (event: unknown) => void;
  onSave?: (w: string, m: string) => void;
  mode?: { kind: string };
  disabled?: boolean;
};
function elements(node: ReactNode): ReactElement<Props>[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<Props>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(text).join("");
  return isValidElement<Props>(node) ? text(node.props.children) : "";
}
function mount(presetIndex = 0) {
  const harness: Harness = { slots: [], cursor: 0 };
  let preset = demoVocabulary.presets[presetIndex] as
    (typeof demoVocabulary.presets)[number] | null;
  let state = createDemoWordState(demoVocabulary.presets.map((p) => p.id));
  const dispatch = (action: VocabularyWordAction) => {
    state = vocabularyWordsReducer(state, action);
  };
  const onClose = vi.fn(() => {
    preset = null;
  });
  function render() {
    harness.cursor = 0;
    runtime.active = harness;
    const tree = VocabularyInspector({
      preset,
      state,
      dispatch,
      onClose,
    });
    runtime.active = null;
    return elements(tree);
  }
  function button(label: string) {
    return render().find(
      (el) =>
        el.props["aria-label"] === label ||
        (el.type === "button" && text(el.props.children) === label),
    )!;
  }
  return {
    render,
    button,
    setPreset: (i: number | null) => {
      preset = i === null ? null : demoVocabulary.presets[i];
    },
    onClose,
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10_000);
  vi.stubGlobal("document", { body: {} });
});
afterEach(() => {
  runtime.active = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const trigger = {
  focus: vi.fn(),
  getBoundingClientRect: () => ({ top: 100, bottom: 136, right: 500 }),
};
const event = { currentTarget: trigger };

describe("existing preset inspector UI integration", () => {
  it.each([0, 1, 2])(
    "shows only preset %s words, and exposes management only for My Words",
    (index) => {
      const app = mount(index),
        view = app.render(),
        html = text(view[0]);
      expect(html).toContain(demoVocabulary.presets[index].title);
      expect(html).toContain("Demo data");
      const words = view
        .filter((el) => el.props["data-word-id"])
        .map((el) => el.props["data-word-id"]);
      expect(words).toHaveLength(index === 0 ? 13 : index === 1 ? 5 : 3);
      expect(words).toContain(
        index === 0 ? "luxuriant" : index === 1 ? "diligent" : "candid",
      );
      expect(Boolean(app.button("Add Word"))).toBe(index === 0);
      expect(
        view.filter((el) => el.props["aria-label"]?.startsWith("Delete "))
          .length,
      ).toBe(index === 0 ? 13 : 0);
    },
  );
  it("opens read-only details for built-ins and refuses a forced save", () => {
    const app = mount(1);
    app.button("diligent").props.onClick!(event);
    let dialog = app.render().find((el) => el.type === VocabularyWordDialog)!;
    expect(dialog.props.mode?.kind).toBe("view");
    dialog.props.onSave!("injected", "changed");
    dialog = app.render().find((el) => el.type === VocabularyWordDialog)!;
    expect(JSON.stringify(dialog.props.mode)).toContain("diligent");
    expect(app.button("injected")).toBeUndefined();
  });
  it("adds and edits My Words through the existing nested dialog, retains changes after switching presets", () => {
    const app = mount();
    app.button("Add Word").props.onClick!(event);
    let dialog = app.render().find((el) => el.type === VocabularyWordDialog)!;
    expect(dialog.props.mode?.kind).toBe("add");
    dialog.props.onSave!("serendipity", "happy accident");
    vi.advanceTimersByTime(200);
    expect(app.button("serendipity")).toBeDefined();
    app.button("serendipity").props.onClick!(event);
    dialog = app.render().find((el) => el.type === VocabularyWordDialog)!;
    expect(dialog.props.mode?.kind).toBe("edit");
    dialog.props.onSave!("fortunate discovery", "updated meaning");
    vi.advanceTimersByTime(200);
    app.setPreset(2);
    expect(app.button("fortunate discovery")).toBeUndefined();
    app.setPreset(null);
    app.render();
    app.setPreset(0);
    expect(app.button("fortunate discovery")).toBeDefined();
  });
  it("toggles personal review preferences for built-ins without exposing editing", () => {
    vi.stubGlobal("window", { innerWidth: 1024, innerHeight: 768 });
    const app = mount(1);
    app.button("More actions for diligent").props.onClick!(event);
    expect(app.button("More actions for diligent").props["aria-expanded"]).toBe(
      true,
    );
    app.button("Exclude").props.onClick!({});
    let row = app
      .render()
      .find((el) => el.props["data-word-id"] === "diligent")!;
    expect(text(row)).toContain("Excluded");
    app.button("More actions for diligent").props.onClick!(event);
    app.button("Unexclude").props.onClick!({});
    row = app.render().find((el) => el.props["data-word-id"] === "diligent")!;
    expect(text(row)).toContain("Learned");
    expect(app.button("Delete diligent")).toBeUndefined();
  });
  it("deletes without opening edit, restores within four seconds and rejects late Undo clicks", () => {
    const app = mount();
    const deleteEvent = {
      currentTarget: { closest: () => ({ offsetHeight: 60 }) },
    };
    app.button("Delete luxuriant").props.onClick!(deleteEvent);
    expect(
      app.render().find((el) => el.type === VocabularyWordDialog),
    ).toBeUndefined();
    vi.advanceTimersByTime(250);
    expect(app.button("luxuriant")).toBeUndefined();
    vi.advanceTimersByTime(3749);
    app.button("Undo").props.onClick!({});
    expect(app.button("luxuriant")).toBeDefined();
    app.button("Delete germinate").props.onClick!(deleteEvent);
    vi.advanceTimersByTime(4000);
    app
      .render()
      .filter((el) => el.type === "button" && text(el) === "Undo")
      .forEach((el) => el.props.onClick!({}));
    expect(app.button("germinate")).toBeUndefined();
  });
  it("renders only the two required fields and no mutation controls in read-only details", () => {
    for (const kind of ["add", "edit", "view"] as const) {
      const mode =
        kind === "add"
          ? { kind }
          : {
              kind,
              word: {
                id: "demo",
                word: "word",
                meaning: "meaning",
                learningStatus: "new" as const,
              },
            };
      const save = vi.fn();
      const html = renderToStaticMarkup(
        <VocabularyWordDialog
          mode={mode}
          open
          dialogRef={createRef()}
          onClose={() => {}}
          onSave={save}
        />,
      );
      expect(html.match(/<input /g)).toHaveLength(1);
      expect(html.match(/<textarea /g)).toHaveLength(1);
      expect(html).not.toContain("Example Sentence");
      expect(html.toLowerCase().includes("readonly")).toBe(kind === "view");
      expect(html.includes('type="submit"')).toBe(kind !== "view");
      expect(html).not.toContain("Delete");
    }
  });
});
