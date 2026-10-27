import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoWordState } from "./vocabulary-words.fixtures";
import {
  isWordSaved,
  vocabularyWordKey,
  vocabularyWordsReducer,
} from "./vocabulary-words";
import {
  practiceQueue,
  startPractice,
  practiceReducer,
  missedEntries,
} from "./vocabulary-practice-state";
import {
  decodeSavedWords,
  loadSavedWords,
  persistSavedWords,
  VOCABULARY_SAVES_KEY,
} from "./vocabulary-practice-storage";
const initial = () =>
  createDemoWordState(["my-words", "nuet-core", "tone-fallacies"]);
const queue = () => practiceQueue(initial(), ["nuet-core"]);
afterEach(() => vi.unstubAllGlobals());

describe("reference flashcard session", () => {
  it("uses only selected presets and non-excluded entries, without changing source data", () => {
    const data = initial(),
      before = JSON.stringify(data);
    expect(practiceQueue(data, ["my-words"])).toHaveLength(11);
    expect(practiceQueue(data, ["nuet-core"])).toHaveLength(4);
    expect(practiceQueue(data, ["tone-fallacies"])).toHaveLength(3);
    expect(practiceQueue(data, ["my-words", "nuet-core"])).toHaveLength(15);
    expect(practiceQueue(data, ["unknown"])).toEqual([]);
    expect(JSON.stringify(data)).toBe(before);
  });
  it("does not accept self-assessment before revealing the meaning; never counts as knew", () => {
    const session = startPractice(queue());
    expect(practiceReducer(session, { type: "answer", kind: "missed" })).toBe(
      session,
    );
    let next = practiceReducer(session, { type: "flip", value: true });
    next = practiceReducer(next, { type: "answer", kind: "never" });
    expect(next.results).toEqual({ [next.queue[0].key]: "knew" });
    expect(next.pos).toBe(0); // Navigation begins only after the outgoing animation.
  });
  it("resets to the word face when navigating, preserves answers and respects queue boundaries", () => {
    let session = practiceReducer(startPractice(queue()), {
      type: "flip",
      value: true,
    });
    session = practiceReducer(session, { type: "answer", kind: "missed" });
    const moved = practiceReducer(session, { type: "move", direction: 1 });
    expect(moved.flipped).toBe(false);
    expect(moved.results).toEqual(session.results);
    expect(practiceReducer(moved, { type: "move", direction: -1 }).pos).toBe(0);
    expect(practiceReducer(session, { type: "move", direction: -1 })).toBe(
      session,
    );
    expect(practiceReducer(session, { type: "move", direction: 99 })).toBe(
      session,
    );
  });
  it("replaces an earlier answer rather than double-counting and can finish an incomplete session", () => {
    let session = practiceReducer(startPractice(queue()), {
      type: "flip",
      value: true,
    });
    session = practiceReducer(session, { type: "answer", kind: "missed" });
    session = practiceReducer(session, { type: "answer", kind: "knew" });
    session = practiceReducer(session, { type: "finish" });
    expect(Object.keys(session.results)).toHaveLength(1);
    expect(missedEntries(session)).toEqual([]);
    expect(session.summary).toBe(true);
    expect(practiceReducer(session, { type: "move", direction: 1 })).toBe(
      session,
    );
    expect(practiceReducer(session, { type: "redo" })).toBe(session);
  });
  it("finishes on the final answer and repeats only missed words with fresh progress", () => {
    const entries = queue().slice(0, 2);
    let session = practiceReducer(startPractice(entries), {
      type: "flip",
      value: true,
    });
    session = practiceReducer(session, { type: "answer", kind: "missed" });
    session = practiceReducer(session, { type: "move", direction: 1 });
    session = practiceReducer(session, { type: "flip", value: true });
    session = practiceReducer(session, { type: "answer", kind: "knew" });
    expect(session.summary).toBe(true);
    expect(missedEntries(session)).toEqual([entries[0]]);
    const redo = practiceReducer(session, { type: "redo" });
    expect(redo).toEqual(startPractice([entries[0]]));
  });
  it("handles a fully excluded or empty selection without manufacturing words or clearing preferences", () => {
    let data = initial();
    for (const word of data.words["nuet-core"])
      data = vocabularyWordsReducer(data, {
        type: "exclude",
        presetId: "nuet-core",
        id: word.id,
      });
    expect(startPractice(practiceQueue(data, ["nuet-core"]))).toMatchObject({
      summary: true,
      queue: [],
      results: {},
    });
    expect(data.exclusions["nuet-core"]).toHaveLength(5);
  });
  it("deduplicates a saved built-in word selected through both its source preset and My Words", () => {
    let data = initial();
    const entry = queue()[0];
    data = vocabularyWordsReducer(data, {
      type: "save-word",
      key: entry.key,
      word: entry.word,
      saved: true,
    });
    const entries = practiceQueue(data, ["my-words", "nuet-core"]);
    expect(entries.filter((item) => item.key === entry.key)).toHaveLength(1);
    expect(entries).toHaveLength(15);
  });
});

describe("reference browser bookmark persistence", () => {
  it("round-trips bookmarks, restores personal copies and keeps shared preset content immutable", () => {
    const entry = queue()[0],
      baseline = initial();
    const saved = vocabularyWordsReducer(baseline, {
      type: "save-word",
      key: entry.key,
      word: entry.word,
      saved: true,
    });
    const items = decodeSavedWords(
      JSON.stringify({ version: 1, items: saved.savePreferences }),
    );
    const restored = vocabularyWordsReducer(initial(), {
      type: "restore-saves",
      items,
    });
    expect(isWordSaved(restored, entry.key)).toBe(true);
    expect(restored.words["nuet-core"]).toBe(baseline.words["nuet-core"]);
    expect(restored.words["my-words"].at(-1)?.meaning).toBe(entry.word.meaning);
  });
  it("persists unsaving a pre-existing personal word and re-saving it without duplicate identities", () => {
    const baseline = initial(),
      word = baseline.words["my-words"][0],
      key = vocabularyWordKey("my-words", word);
    const unsaved = vocabularyWordsReducer(baseline, {
      type: "save-word",
      key,
      word,
      saved: false,
    });
    expect(isWordSaved(unsaved, key)).toBe(false);
    const restored = vocabularyWordsReducer(initial(), {
      type: "restore-saves",
      items: decodeSavedWords(
        JSON.stringify({ version: 1, items: unsaved.savePreferences }),
      ),
    });
    expect(isWordSaved(restored, key)).toBe(false);
    const resaved = vocabularyWordsReducer(restored, {
      type: "save-word",
      key,
      word,
      saved: true,
    });
    expect(
      resaved.words["my-words"].filter(
        (item) => vocabularyWordKey("my-words", item) === key,
      ),
    ).toHaveLength(1);
  });
  it("rejects malformed, unsupported and invalid stored records", () => {
    for (const raw of [
      null,
      "",
      "{",
      "null",
      "[]",
      '{"version":2,"items":[]}',
      '{"version":1,"items":"wrong"}',
      '{"version":1,"items":[{"key":"bad","word":{"id":"x","word":"word","meaning":"meaning","learningStatus":["new"]}}]}',
      '{"version":1,"items":[null,{},{"key":"bad","word":{}},{"key":"bad","word":{"id":"x","word":"","meaning":"m","learningStatus":"new"}}]}',
    ])
      expect(decodeSavedWords(raw)).toEqual([]);
  });
  it("keeps only valid data and the latest preference per word", () => {
    const entry = queue()[0];
    const raw = JSON.stringify({
      version: 1,
      items: [
        { key: entry.key, word: entry.word },
        { key: entry.key, word: null },
      ],
    });
    expect(decodeSavedWords(raw)).toEqual([{ key: entry.key, word: null }]);
  });
  it("remains functional if storage is unavailable or full and writes the versioned practice key", () => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => null, setItem });
    persistSavedWords([]);
    expect(setItem).toHaveBeenCalledWith(
      VOCABULARY_SAVES_KEY,
      '{"version":1,"items":[]}',
    );
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("blocked");
      },
      setItem: () => {
        throw Error("full");
      },
    });
    expect(loadSavedWords()).toEqual([]);
    expect(() => persistSavedWords([])).not.toThrow();
  });
});
