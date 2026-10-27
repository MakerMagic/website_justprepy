export type LearningStatus = "learned" | "missed" | "new";
export type WordStatus = LearningStatus | "excluded";
export type VocabularyWord = Readonly<{
  id: string;
  word: string;
  meaning: string;
  learningStatus: LearningStatus;
  partOfSpeech?: string;
  definition?: string;
  practiceMeaning?: string;
  sourceKey?: string;
}>;
export type DeletedWord = Readonly<{
  token: string;
  presetId: string;
  word: VocabularyWord;
  index: number;
  excluded: boolean;
  expiresAt: number;
  dismissed?: boolean;
}>;
export type SavedWordPreference = Readonly<{
  key: string;
  word: VocabularyWord | null;
}>;
export type VocabularyWordState = Readonly<{
  words: Readonly<Record<string, readonly VocabularyWord[]>>;
  exclusions: Readonly<Record<string, readonly string[]>>;
  deletions: readonly DeletedWord[];
  savePreferences: readonly SavedWordPreference[];
}>;
export const UNDO_DURATION = 4_000;
export const STATUS_LABELS: Record<WordStatus, string> = {
  learned: "Learned",
  missed: "Missed",
  new: "New",
  excluded: "Excluded",
};
// This frontend has one personal deck. Unknown/future presets are read-only.
export function canManageWords(presetId: string) {
  return presetId === "my-words";
}
export function wordStatus(
  state: VocabularyWordState,
  presetId: string,
  word: VocabularyWord,
): WordStatus {
  return state.exclusions[presetId]?.includes(word.id)
    ? "excluded"
    : word.learningStatus;
}
export function validateWord(word: string, meaning: string) {
  const w = word.trim(),
    m = meaning.trim();
  const wordError =
    w && (w.length > 48 || w.split(/\s+/).length > 4)
      ? "Up to 4 words and 48 characters."
      : "";
  const meaningError = m.length > 300 ? "Up to 300 characters." : "";
  return {
    wordError,
    meaningError,
    valid: Boolean(w && m && !wordError && !meaningError),
  };
}
export function vocabularyWordKey(presetId: string, word: VocabularyWord) {
  return word.sourceKey ?? JSON.stringify([presetId, word.id]);
}
export function isWordSaved(state: VocabularyWordState, key: string) {
  return (state.words["my-words"] ?? []).some(
    (word) => vocabularyWordKey("my-words", word) === key,
  );
}
function savePreference(
  state: VocabularyWordState,
  key: string,
  word: VocabularyWord | null,
) {
  return [
    ...state.savePreferences.filter((item) => item.key !== key),
    { key, word },
  ];
}
export type VocabularyWordAction =
  | { type: "restore-saves"; items: readonly SavedWordPreference[] }
  | { type: "save-word"; key: string; word: VocabularyWord; saved: boolean }
  | { type: "exclude"; presetId: string; id: string }
  | { type: "toggle-exclusion"; presetId: string; id: string }
  | { type: "add"; presetId: string; id: string; word: string; meaning: string }
  | {
      type: "edit";
      presetId: string;
      id: string;
      word: string;
      meaning: string;
    }
  | { type: "delete"; presetId: string; id: string; token: string; now: number }
  | { type: "undo"; token: string; now: number }
  | { type: "expire"; token: string }
  | { type: "forget"; token: string };
export function vocabularyWordsReducer(
  state: VocabularyWordState,
  action: VocabularyWordAction,
): VocabularyWordState {
  if (action.type === "restore-saves") {
    return action.items.reduce((current, item) => {
      if (item.word) {
        if (!validateWord(item.word.word, item.word.meaning).valid)
          return current;
        const next = vocabularyWordsReducer(current, {
          type: "save-word",
          key: item.key,
          word: item.word,
          saved: true,
        });
        const restored = next.words["my-words"]?.find(
          (word) => vocabularyWordKey("my-words", word) === item.key,
        );
        if (!restored) return current;
        const copy = { ...item.word, id: restored.id, sourceKey: item.key };
        return {
          ...next,
          words: {
            ...next.words,
            "my-words": next.words["my-words"].map((word) =>
              word.id === restored.id ? copy : word,
            ),
          },
          savePreferences: savePreference(next, item.key, copy),
        };
      }
      const matching = (current.words["my-words"] ?? []).find(
        (word) => vocabularyWordKey("my-words", word) === item.key,
      );
      if (matching)
        return vocabularyWordsReducer(current, {
          type: "save-word",
          key: item.key,
          word: matching,
          saved: false,
        });
      return {
        ...current,
        savePreferences: savePreference(current, item.key, null),
      };
    }, state);
  }
  if (action.type === "save-word") {
    const personal = state.words["my-words"];
    if (
      !personal ||
      !action.key ||
      !validateWord(action.word.word, action.word.meaning).valid
    )
      return state;
    const existing = personal.find(
      (word) => vocabularyWordKey("my-words", word) === action.key,
    );
    const copy: VocabularyWord = existing ?? {
      ...action.word,
      id: "saved-" + encodeURIComponent(action.key),
      sourceKey: action.key,
    };
    return {
      ...state,
      words: {
        ...state.words,
        "my-words": action.saved
          ? existing
            ? personal
            : [...personal, copy]
          : personal.filter(
              (word) => vocabularyWordKey("my-words", word) !== action.key,
            ),
      },
      exclusions: {
        ...state.exclusions,
        "my-words": action.saved
          ? (state.exclusions["my-words"] ?? [])
          : (state.exclusions["my-words"] ?? []).filter(
              (id) => id !== existing?.id,
            ),
      },
      savePreferences: savePreference(
        state,
        action.key,
        action.saved ? copy : null,
      ),
    };
  }
  if (action.type === "forget")
    return {
      ...state,
      deletions: state.deletions.filter((d) => d.token !== action.token),
    };
  if (action.type === "expire")
    return {
      ...state,
      deletions: state.deletions.map((d) =>
        d.token === action.token ? { ...d, dismissed: true } : d,
      ),
    };
  if (action.type === "undo") {
    const deletion = state.deletions.find((d) => d.token === action.token);
    if (
      !deletion ||
      deletion.dismissed ||
      !canManageWords(deletion.presetId) ||
      action.now >= deletion.expiresAt
    )
      return state;
    const words = state.words[deletion.presetId];
    if (!words || words.some((w) => w.id === deletion.word.id)) return state;
    const restored = [...words];
    restored.splice(
      Math.min(deletion.index, restored.length),
      0,
      deletion.word,
    );
    const key = vocabularyWordKey(deletion.presetId, deletion.word);
    return {
      ...state,
      words: { ...state.words, [deletion.presetId]: restored },
      savePreferences: state.savePreferences.some((item) => item.key === key)
        ? savePreference(state, key, deletion.word)
        : state.savePreferences,
      exclusions: {
        ...state.exclusions,
        [deletion.presetId]: deletion.excluded
          ? [...(state.exclusions[deletion.presetId] ?? []), deletion.word.id]
          : (state.exclusions[deletion.presetId] ?? []).filter(
              (id) => id !== deletion.word.id,
            ),
      },
      deletions: state.deletions.map((d) =>
        d.token === action.token ? { ...d, dismissed: true } : d,
      ),
    };
  }
  const words = state.words[action.presetId];
  if (!words) return state;
  const index = words.findIndex((w) => w.id === action.id);
  if (action.type === "toggle-exclusion" || action.type === "exclude") {
    if (index < 0) return state;
    const exclusions = state.exclusions[action.presetId] ?? [];
    if (action.type === "exclude" && exclusions.includes(action.id))
      return state;
    return {
      ...state,
      exclusions: {
        ...state.exclusions,
        [action.presetId]: exclusions.includes(action.id)
          ? exclusions.filter((id) => id !== action.id)
          : [...exclusions, action.id],
      },
    };
  }
  // Content management remains My Words-only, independent of rendered controls.
  if (!canManageWords(action.presetId)) return state;
  if (action.type === "delete") {
    if (index < 0 || state.deletions.some((d) => d.token === action.token))
      return state;
    const key = vocabularyWordKey(action.presetId, words[index]);
    return {
      ...state,
      words: {
        ...state.words,
        [action.presetId]: words.filter((w) => w.id !== action.id),
      },
      exclusions: {
        ...state.exclusions,
        [action.presetId]: (state.exclusions[action.presetId] ?? []).filter(
          (id) => id !== action.id,
        ),
      },
      savePreferences: state.savePreferences.some((item) => item.key === key)
        ? savePreference(state, key, null)
        : state.savePreferences,
      deletions: [
        ...state.deletions,
        {
          token: action.token,
          presetId: action.presetId,
          word: words[index],
          index,
          excluded:
            wordStatus(state, action.presetId, words[index]) === "excluded",
          expiresAt: action.now + UNDO_DURATION,
        },
      ],
    };
  }
  if (!validateWord(action.word, action.meaning).valid) return state;
  if (action.type === "add") {
    if (index >= 0 || state.deletions.some((d) => d.word.id === action.id))
      return state;
    return {
      ...state,
      words: {
        ...state.words,
        [action.presetId]: [
          {
            id: action.id,
            word: action.word.trim(),
            meaning: action.meaning.trim(),
            learningStatus: "new",
          },
          ...words,
        ],
      },
    };
  }
  if (index < 0) return state;
  const original = words[index];
  const updated: VocabularyWord = {
    ...original,
    word: action.word.trim(),
    meaning: action.meaning.trim(),
    ...(original.word !== action.word.trim()
      ? { partOfSpeech: undefined, definition: undefined }
      : {}),
    practiceMeaning:
      original.word === action.word.trim() &&
      original.meaning === action.meaning.trim()
        ? original.practiceMeaning
        : undefined,
  };
  const key = vocabularyWordKey(action.presetId, original);
  return {
    ...state,
    words: {
      ...state.words,
      [action.presetId]: words.map((word) =>
        word.id === action.id ? updated : word,
      ),
    },
    savePreferences: state.savePreferences.some((item) => item.key === key)
      ? savePreference(state, key, updated)
      : state.savePreferences,
  };
}
