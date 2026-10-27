export type VocabularyPreset = {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  custom?: boolean;
};
export type VocabularyData = {
  wordsLearned: number;
  retentionRate: number;
  presets: readonly VocabularyPreset[];
};
// Screenshot-derived illustrative view data; no vocabulary records or study engine.
export const demoVocabulary: VocabularyData = {
  wordsLearned: 148,
  retentionRate: 84,
  presets: [
    {
      id: "my-words",
      title: "My Words",
      description:
        "Personal collection of vocabulary items saved during Mock Tests and Question Bank practice.",
      wordCount: 42,
      custom: true,
    },
    {
      id: "nuet-core",
      title: "High-Frequency NUET Core",
      description:
        "Essential academic words and logical connectors most commonly tested in TSA & NUET exams.",
      wordCount: 320,
    },
    {
      id: "tone-fallacies",
      title: "Advanced Tone & Fallacies",
      description:
        "Nuanced evaluative words, fallacies terminology, and subtle authorial tone descriptors.",
      wordCount: 185,
    },
  ],
};
