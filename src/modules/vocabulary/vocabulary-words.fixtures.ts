import type {
  LearningStatus,
  VocabularyWord,
  VocabularyWordState,
} from "./vocabulary-words";
const practiceDetails: Readonly<
  Record<
    string,
    Pick<VocabularyWord, "partOfSpeech" | "definition" | "practiceMeaning">
  >
> = {
  luxuriant: {
    partOfSpeech: "adjective",
    definition: "growing thickly, richly, and in great abundance",
    practiceMeaning: "пышный, буйный",
  },
  germinate: {
    partOfSpeech: "verb",
    definition:
      "to begin to sprout and grow, as a seed does; to start developing",
    practiceMeaning: "прорастать",
  },
  meticulous: {
    partOfSpeech: "adjective",
    definition: "showing great attention to detail; very careful and precise",
    practiceMeaning: "дотошный, скрупулёзный",
  },
  ambiguous: {
    partOfSpeech: "adjective",
    definition: "open to more than one interpretation; not clear",
    practiceMeaning: "двусмысленный",
  },
  scrutinize: {
    partOfSpeech: "verb",
    definition: "to examine something very closely and critically",
    practiceMeaning: "тщательно изучать",
  },
  pragmatic: {
    partOfSpeech: "adjective",
    definition: "dealing with things sensibly and realistically",
    practiceMeaning: "прагматичный",
  },
  ephemeral: {
    partOfSpeech: "adjective",
    definition: "lasting for a very short time",
    practiceMeaning: "мимолётный",
  },
  cohesion: {
    partOfSpeech: "noun",
    definition: "the state of parts sticking or working together as one whole",
    practiceMeaning: "связность, сплочённость",
  },
};
// Original Claude examples, not a user's saved words or a complete preset database.
const word = (
  id: string,
  text: string,
  meaning: string,
  learningStatus: LearningStatus,
): VocabularyWord =>
  Object.freeze({
    id,
    word: text,
    meaning,
    learningStatus,
    ...practiceDetails[text],
  });
const samples: Readonly<Record<string, readonly VocabularyWord[]>> =
  Object.freeze({
    "my-words": Object.freeze([
      word("luxuriant", "luxuriant", "пышный, буйный", "learned"),
      word("germinate", "germinate", "прорастать", "missed"),
      word("meticulous", "meticulous", "дотошный", "new"),
      word("ambiguous", "ambiguous", "двусмысленный", "missed"),
      word("scrutinize", "scrutinize", "тщательно изучать", "learned"),
      word("pragmatic", "pragmatic", "прагматичный", "new"),
      word("ephemeral", "ephemeral", "мимолётный", "missed"),
      word("cohesion", "cohesion", "связность", "new"),
      word("resilient", "resilient", "стойкий", "learned"),
      word("pervasive", "pervasive", "всепроникающий", "new"),
      word("mitigate", "mitigate", "смягчать", "missed"),
      word("arbitrary", "arbitrary", "произвольный", "new"),
      word("eloquent", "eloquent", "красноречивый", "learned"),
    ]),
    "nuet-core": Object.freeze([
      word("diligent", "diligent", "усердный", "learned"),
      word("obsolete", "obsolete", "устаревший", "missed"),
      word("versatile", "versatile", "разносторонний", "learned"),
      word("hypothesis", "hypothesis", "гипотеза", "new"),
      word("inevitable", "inevitable", "неизбежный", "missed"),
    ]),
    "tone-fallacies": Object.freeze([
      word("candid", "candid", "откровенный", "new"),
      word("reluctant", "reluctant", "неохотный", "new"),
      word("subtle", "subtle", "тонкий", "new"),
    ]),
  });
export function createDemoWordState(
  presetIds: readonly string[],
): VocabularyWordState {
  return {
    words: Object.fromEntries(presetIds.map((id) => [id, samples[id] ?? []])),
    exclusions: Object.fromEntries(
      presetIds.map((id) => [
        id,
        id === "my-words"
          ? ["ambiguous", "arbitrary"]
          : id === "nuet-core"
            ? ["hypothesis"]
            : [],
      ]),
    ),
    deletions: [],
    savePreferences: [],
  };
}
