import type { VocabularyWord, VocabularyWordState } from "./vocabulary-words";
import { vocabularyWordKey } from "./vocabulary-words";
export type PracticeEntry = Readonly<{
  key: string;
  presetId: string;
  word: VocabularyWord;
}>;
export type PracticeResult = "missed" | "knew";
export type PracticeSession = Readonly<{
  queue: readonly PracticeEntry[];
  pos: number;
  flipped: boolean;
  results: Readonly<Record<string, PracticeResult>>;
  summary: boolean;
}>;
export type PracticeAction =
  | { type: "flip"; value: boolean }
  | { type: "move"; direction: number }
  | { type: "answer"; kind: PracticeResult | "never" }
  | { type: "finish" }
  | { type: "redo" };
export function practiceQueue(
  state: VocabularyWordState,
  presetIds: readonly string[],
): PracticeEntry[] {
  const seen = new Set<string>();
  return presetIds.flatMap((presetId) =>
    (state.words[presetId] ?? []).flatMap((word) => {
      const key = vocabularyWordKey(presetId, word);
      if (state.exclusions[presetId]?.includes(word.id) || seen.has(key))
        return [];
      seen.add(key);
      return [{ key, presetId, word }];
    }),
  );
}
export function startPractice(
  queue: readonly PracticeEntry[],
): PracticeSession {
  return {
    queue,
    pos: 0,
    flipped: false,
    results: {},
    summary: queue.length === 0,
  };
}
export function missedEntries(session: PracticeSession) {
  return session.queue.filter(
    (entry) => session.results[entry.key] === "missed",
  );
}
export function practiceReducer(
  session: PracticeSession,
  action: PracticeAction,
): PracticeSession {
  if (action.type === "redo") {
    const missed = missedEntries(session);
    return session.summary && missed.length ? startPractice(missed) : session;
  }
  if (session.summary) return session;
  if (action.type === "finish") return { ...session, summary: true };
  if (action.type === "flip") return { ...session, flipped: action.value };
  if (action.type === "move") {
    const pos = session.pos + action.direction;
    return pos < 0 || pos >= session.queue.length
      ? session
      : { ...session, pos, flipped: false };
  }
  if (!session.flipped) return session;
  const current = session.queue[session.pos];
  return {
    ...session,
    results: {
      ...session.results,
      [current.key]: action.kind === "missed" ? "missed" : "knew",
    },
    summary: session.pos === session.queue.length - 1,
  };
}
