import {
  validateWord,
  type SavedWordPreference,
  type VocabularyWord,
} from "./vocabulary-words";
// Non-authoritative browser bookmarks only. No account or server persistence.
export const VOCABULARY_SAVES_KEY = "justprepy:vocabulary:saves:v1";
function savedWord(value: unknown): VocabularyWord | null {
  if (!value || typeof value !== "object") return null;
  const w = value as Record<string, unknown>;
  if (
    typeof w.id !== "string" ||
    !w.id ||
    w.id.length > 1024 ||
    typeof w.word !== "string" ||
    typeof w.meaning !== "string" ||
    !validateWord(w.word, w.meaning).valid ||
    typeof w.learningStatus !== "string" ||
    !["new", "learned", "missed"].includes(w.learningStatus)
  )
    return null;
  const optional: Record<string, string> = {};
  for (const key of [
    "partOfSpeech",
    "definition",
    "practiceMeaning",
    "sourceKey",
  ] as const)
    if (typeof w[key] === "string" && w[key].length <= 2000)
      optional[key] = w[key];
  return {
    id: w.id,
    word: w.word,
    meaning: w.meaning,
    learningStatus: w.learningStatus as VocabularyWord["learningStatus"],
    ...optional,
  };
}
export function decodeSavedWords(raw: string | null): SavedWordPreference[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (
      !data ||
      typeof data !== "object" ||
      !("version" in data) ||
      data.version !== 1 ||
      !("items" in data) ||
      !Array.isArray(data.items)
    )
      return [];
    const items = new Map<string, SavedWordPreference>();
    for (const item of data.items.slice(0, 2000)) {
      if (
        !item ||
        typeof item.key !== "string" ||
        !item.key ||
        item.key.length > 1024
      )
        continue;
      if (item.word === null)
        items.set(item.key, { key: item.key, word: null });
      else {
        const word = savedWord(item.word);
        if (word) items.set(item.key, { key: item.key, word });
      }
    }
    return [...items.values()];
  } catch {
    return [];
  }
}
export function loadSavedWords(): SavedWordPreference[] {
  try {
    return decodeSavedWords(localStorage.getItem(VOCABULARY_SAVES_KEY));
  } catch {
    return [];
  }
}
export function persistSavedWords(items: readonly SavedWordPreference[]) {
  try {
    localStorage.setItem(
      VOCABULARY_SAVES_KEY,
      JSON.stringify({ version: 1, items }),
    );
  } catch {
    // Practice remains usable when storage is blocked or full, as in the reference.
  }
}
