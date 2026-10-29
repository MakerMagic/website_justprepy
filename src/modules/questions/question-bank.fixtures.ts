import type {
  Difficulty,
  QuestionBankData,
  Subject,
} from "./question-bank.types";

const topic = (id: string, name: string) => ({ id, name });
const subjects: Subject[] = [
  {
    id: "critical-thinking",
    name: "Critical Thinking",
    topics: [
      topic("principles", "Applying Principles"),
      topic("conclusion", "Drawing a Conclusion"),
      topic("assumptions", "Identifying an Assumption"),
      topic("impact", "Assessing the Impact"),
      topic("arguments", "Matching Arguments"),
      topic("flaws", "Detecting Flaws"),
      topic("main-conclusion", "Main Conclusion"),
    ],
  },
  {
    id: "problem-solving",
    name: "Problem Solving",
    topics: [
      topic("procedures", "Finding Procedures"),
      topic("similarity", "Identifying Similarity"),
      topic("selection", "Relevant Selection"),
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    topics: [
      topic("units", "Units"),
      topic("numbers", "Numbers"),
      topic("ratio", "Ratio and Proportion"),
      topic("algebra", "Algebra"),
      topic("geometry", "Geometry"),
    ],
  },
];

/** Source/year availability is illustrative configuration, not verified historical coverage.
 * Deterministic illustrative metadata. No real exam questions, answers or student records. */
export const demoQuestionBank: QuestionBankData = {
  telegramUrl: "https://t.me/justprepy",
  profile: { name: "MakerMagicNow", initials: "MM", plan: "Pro" },
  sources: [
    {
      id: "tsa-oxford",
      label: "TSA Oxford",
      years: Array.from({ length: 21 }, (_, index) => 2024 - index),
    },
    { id: "bmat", label: "BMAT", years: [2023, 2022, 2021, 2020, 2019, 2018] },
    { id: "nuet-practice", label: "NUET practice", years: null },
  ],
  subjects,
  questions: subjects
    .flatMap((subject) => subject.topics)
    .flatMap((topic, topicIndex) =>
      Array.from({ length: 33 }, (_, index) => {
        const solved = [7, 18, 4, 2, 13, 9, 5, 6, 0, 3, 0, 8, 4, 1, 2][
          topicIndex
        ];
        const result = index % 10;
        return {
          id: `demo-${topic.id}-${index}`,
          topicId: topic.id,
          source:
            index < 21 ? "tsa-oxford" : index < 27 ? "nuet-practice" : "bmat",
          year:
            index < 21 ? 2024 - index : index < 27 ? null : 2023 - (index - 27),
          difficulty: (["easy", "medium", "hard"] as Difficulty[])[
            (index + topicIndex) % 3
          ],
          status:
            index >= solved
              ? ("unanswered" as const)
              : result < 7
                ? ("correct" as const)
                : result < 8
                  ? ("partial" as const)
                  : result < 10
                    ? ("wrong" as const)
                    : ("unanswered" as const),
          saved: (index + topicIndex) % 7 === 0,
        };
      }),
    ),
};
