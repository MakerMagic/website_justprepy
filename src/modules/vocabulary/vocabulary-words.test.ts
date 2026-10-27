import { describe, expect, it } from "vitest";
import { createDemoWordState } from "./vocabulary-words.fixtures";
import {
  vocabularyWordsReducer as reduce,
  wordStatus,
  validateWord,
  type VocabularyWordAction,
  type VocabularyWordState,
} from "./vocabulary-words";
const ids = ["my-words", "nuet-core", "tone-fallacies", "future-preset"];
const initial = () => createDemoWordState(ids);

describe("preset content permissions and personal exclusions", () => {
  it.each(["nuet-core", "tone-fallacies", "future-preset"])(
    "rejects every content mutation for %s independently of the UI",
    (presetId) => {
      const state = initial(),
        id = state.words[presetId][0]?.id ?? "unknown";
      const actions: VocabularyWordAction[] = [
        {
          type: "add",
          presetId,
          id: "injected",
          word: "altered",
          meaning: "changed",
        },
        { type: "edit", presetId, id, word: "altered", meaning: "changed" },
        { type: "delete", presetId, id, token: "forbidden", now: 0 },
      ];
      for (const action of actions) expect(reduce(state, action)).toBe(state);
      // Even a forged Undo snapshot cannot write into a built-in or future preset.
      const forged: VocabularyWordState = {
        ...state,
        deletions: [
          {
            presetId,
            token: "forged",
            word: {
              id: "forged",
              word: "injected",
              meaning: "injected",
              learningStatus: "new",
            },
            index: 0,
            excluded: false,
            expiresAt: 4_000,
          },
        ],
      };
      expect(reduce(forged, { type: "undo", token: "forged", now: 1 })).toBe(
        forged,
      );
    },
  );
  it("excludes without mutating shared words, restores previous status, and isolates presets/sessions", () => {
    const state = initial();
    for (const presetId of ids.slice(0, 3)) {
      for (const word of state.words[presetId]) {
        const before = wordStatus(state, presetId, word);
        const excluded = reduce(state, {
          type: "toggle-exclusion",
          presetId,
          id: word.id,
        });
        expect(excluded.words).toBe(state.words);
        expect(wordStatus(excluded, presetId, word)).toBe(
          before === "excluded" ? word.learningStatus : "excluded",
        );
        const restored = reduce(excluded, {
          type: "toggle-exclusion",
          presetId,
          id: word.id,
        });
        expect(wordStatus(restored, presetId, word)).toBe(before);
      }
    }
    const changed = reduce(state, {
      type: "toggle-exclusion",
      presetId: "my-words",
      id: "ambiguous",
    });
    expect(changed.exclusions["nuet-core"]).toBe(state.exclusions["nuet-core"]);
    expect(initial().exclusions["my-words"]).toContain("ambiguous");
  });
  it("adds trimmed personal entries, edits both fields and preserves learning and exclusion status", () => {
    let state = reduce(initial(), {
      type: "add",
      presetId: "my-words",
      id: "own",
      word: "  own phrase ",
      meaning: " meaning ",
    });
    expect(state.words["my-words"][0]).toEqual({
      id: "own",
      word: "own phrase",
      meaning: "meaning",
      learningStatus: "new",
    });
    state = reduce(state, {
      type: "edit",
      presetId: "my-words",
      id: "ambiguous",
      word: "new phrase",
      meaning: "updated",
    });
    const edited = state.words["my-words"].find((w) => w.id === "ambiguous")!;
    expect(edited).toMatchObject({
      word: "new phrase",
      meaning: "updated",
      learningStatus: "missed",
    });
    expect(wordStatus(state, "my-words", edited)).toBe("excluded");
  });
  it("rejects missing/invalid entries and duplicate IDs without changing content", () => {
    const state = initial();
    for (const [word, meaning] of [
      ["", "meaning"],
      ["word", ""],
      ["a b c d e", "meaning"],
      ["x".repeat(49), "meaning"],
      ["word", "x".repeat(301)],
    ]) {
      expect(
        reduce(state, {
          type: "add",
          presetId: "my-words",
          id: "new",
          word,
          meaning,
        }),
      ).toBe(state);
      expect(
        reduce(state, {
          type: "edit",
          presetId: "my-words",
          id: "luxuriant",
          word,
          meaning,
        }),
      ).toBe(state);
    }
    expect(
      reduce(state, {
        type: "edit",
        presetId: "my-words",
        id: "missing",
        word: "ok",
        meaning: "ok",
      }),
    ).toBe(state);
    expect(
      reduce(state, {
        type: "add",
        presetId: "my-words",
        id: "luxuriant",
        word: "ok",
        meaning: "ok",
      }),
    ).toBe(state);
    expect(validateWord("one two three four", "x".repeat(300)).valid).toBe(
      true,
    );
  });
});

describe("four-second deletion undo", () => {
  const deleted = () =>
    reduce(initial(), {
      type: "delete",
      presetId: "my-words",
      id: "ambiguous",
      token: "undo",
      now: 1_000,
    });
  it("restores exact data, order and exclusion before the deadline and permits only one undo", () => {
    const state = deleted();
    expect(state.words["my-words"].some((w) => w.id === "ambiguous")).toBe(
      false,
    );
    const restored = reduce(state, { type: "undo", token: "undo", now: 4_999 });
    expect(restored.words["my-words"]).toEqual(initial().words["my-words"]);
    expect(
      wordStatus(restored, "my-words", restored.words["my-words"][3]),
    ).toBe("excluded");
    expect(reduce(restored, { type: "undo", token: "undo", now: 4_999 })).toBe(
      restored,
    );
  });
  it.each([5_000, 5_001, 20_000])(
    "refuses undo at %d, including during the 200ms exit animation",
    (now) => {
      const state = deleted();
      expect(reduce(state, { type: "undo", token: "undo", now })).toBe(state);
      const expired = reduce(state, { type: "expire", token: "undo" });
      const forgotten = reduce(expired, { type: "forget", token: "undo" });
      expect(forgotten.deletions).toHaveLength(0);
      expect(
        forgotten.words["my-words"].some((w) => w.id === "ambiguous"),
      ).toBe(false);
    },
  );
  it("handles multiple independent deletions without affecting another preset", () => {
    let state = deleted();
    state = reduce(state, {
      type: "delete",
      presetId: "my-words",
      id: "luxuriant",
      token: "second",
      now: 2_000,
    });
    state = reduce(state, { type: "undo", token: "undo", now: 4_000 });
    state = reduce(state, { type: "undo", token: "second", now: 5_999 });
    expect(
      state.words["my-words"].filter((w) =>
        ["ambiguous", "luxuriant"].includes(w.id),
      ),
    ).toHaveLength(2);
    expect(state.words["nuet-core"]).toBe(initial().words["nuet-core"]);
  });
});

describe("practice saves and exclusions preserve preset permissions", () => {
  it("saves a personal copy without modifying the shared preset and supports unsaving", () => {
    const original = initial(),
      word = original.words["nuet-core"][0],
      key = JSON.stringify(["nuet-core", word.id]);
    const saved = reduce(original, {
      type: "save-word",
      key,
      word,
      saved: true,
    });
    expect(saved.words["nuet-core"]).toBe(original.words["nuet-core"]);
    expect(saved.words["my-words"].at(-1)).toMatchObject({
      word: word.word,
      meaning: word.meaning,
      sourceKey: key,
    });
    const unsaved = reduce(saved, {
      type: "save-word",
      key,
      word,
      saved: false,
    });
    expect(unsaved.words["my-words"]).toEqual(original.words["my-words"]);
    expect(unsaved.words["nuet-core"]).toBe(original.words["nuet-core"]);
    expect(unsaved.savePreferences).toEqual([{ key, word: null }]);
  });
  it("never-show is idempotent and never unexcludes an already excluded word", () => {
    const original = initial();
    expect(
      reduce(original, {
        type: "exclude",
        presetId: "my-words",
        id: "ambiguous",
      }),
    ).toBe(original);
    const changed = reduce(original, {
      type: "exclude",
      presetId: "nuet-core",
      id: "diligent",
    });
    expect(changed.words).toBe(original.words);
    expect(
      reduce(changed, {
        type: "exclude",
        presetId: "nuet-core",
        id: "diligent",
      }),
    ).toBe(changed);
  });
  it("keeps bookmarked edits/delete/Undo coherent without giving built-ins content management", () => {
    let state = initial();
    const word = state.words["nuet-core"][0],
      key = JSON.stringify(["nuet-core", word.id]);
    state = reduce(state, { type: "save-word", key, word, saved: true });
    const copy = state.words["my-words"].at(-1)!;
    state = reduce(state, {
      type: "edit",
      presetId: "my-words",
      id: copy.id,
      word: "edited copy",
      meaning: "personal meaning",
    });
    expect(state.savePreferences[0].word?.word).toBe("edited copy");
    const afterEdit = state;
    state = reduce(state, {
      type: "delete",
      presetId: "my-words",
      id: copy.id,
      token: "copy-delete",
      now: 0,
    });
    expect(state.savePreferences[0].word).toBeNull();
    state = reduce(state, { type: "undo", token: "copy-delete", now: 3999 });
    expect(state.savePreferences[0].word?.word).toBe("edited copy");
    expect(state.words["nuet-core"]).toBe(afterEdit.words["nuet-core"]);
    const restored = reduce(initial(), {
      type: "restore-saves",
      items: state.savePreferences,
    });
    expect(restored.words["my-words"].at(-1)?.word).toBe("edited copy");
  });
  it("restores saved personal edits over fixture defaults, rejecting invalid saved content", () => {
    let state = initial();
    const word = state.words["my-words"][0],
      key = JSON.stringify(["my-words", word.id]);
    state = reduce(state, { type: "save-word", key, word, saved: true });
    state = reduce(state, {
      type: "edit",
      presetId: "my-words",
      id: word.id,
      word: "personal phrase",
      meaning: "new meaning",
    });
    const restored = reduce(initial(), {
      type: "restore-saves",
      items: state.savePreferences,
    });
    expect(restored.words["my-words"][0]).toMatchObject({
      word: "personal phrase",
      meaning: "new meaning",
    });
    const original = initial();
    expect(
      reduce(original, {
        type: "restore-saves",
        items: [{ key, word: { ...word, word: "" } }],
      }),
    ).toBe(original);
  });
});
