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
// Preset presentation only. Available counts are derived from the current word state.
export const demoVocabulary: VocabularyData = {
  wordsLearned: 148,
  retentionRate: 84,
  presets: [
    {
      id: "my-words",
      title: "My Words",
      description: "Words saved by you.",
      wordCount: 13,
      custom: true,
    },
    {
      id: "nuet-core",
      title: "Essential Words",
      description:
        "Core vocabulary needed to understand and work with different types of texts.",
      wordCount: 5,
    },
    {
      id: "nature",
      title: "Nature Words",
      description:
        "Essential vocabulary related to natural phenomena and the natural world.",
      wordCount: 0,
    },
    {
      id: "math_basics",
      title: "Maths Basics",
      description:
        "Essential mathematical vocabulary for understanding and solving maths problems.",
      wordCount: 0,
    },
    {
      id: "math_formulas",
      title: "Maths Formulas",
      description: "Essential maths formulas for the NUET.",
      wordCount: 0,
    },
  ],
};
