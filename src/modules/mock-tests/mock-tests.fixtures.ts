import type {
  MockTest,
  MockTestResultDetails,
  MockQuestionResultStatus,
} from "./mock-tests.types";

/** Temporary, owner-authorized details for the existing 211/240 demo completion. */
function demoCompletedQuestions(): MockTestResultDetails["questions"] {
  let seed = 7,
    number = 1;
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  return (
    [
      { id: "ct", correct: 25, incorrect: 0, omitted: 0 },
      { id: "ps", correct: 14, incorrect: 1, omitted: 0 },
      { id: "m", correct: 14, incorrect: 4, omitted: 2 },
    ] as const
  ).flatMap((section) => {
    const statuses: MockQuestionResultStatus[] = [
      ...Array<MockQuestionResultStatus>(section.correct).fill("correct"),
      ...Array<MockQuestionResultStatus>(section.incorrect).fill("incorrect"),
      ...Array<MockQuestionResultStatus>(section.omitted).fill("omitted"),
    ];
    for (let i = statuses.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [statuses[i], statuses[j]] = [statuses[j], statuses[i]];
    }
    return statuses.map((status) => {
      const position = number++;
      return {
        id: "demo-mock-4-q-" + position,
        number: position,
        section: section.id,
        status,
      };
    });
  });
}

/** Illustrative catalogue only; not published tests or real user results. */
export const demoMockTests: MockTest[] = [
  {
    id: "demo-mock-1",
    title: "Mock Test #1",
    type: "full",
    subjects: {
      criticalThinking: "hard",
      problemSolving: "hard",
      mathematics: "hard",
    },
    passedCount: 105,
    durationMinutes: 120,
    questionCount: 60,
    maxScore: 240,
    result: null,
  },
  {
    id: "demo-mock-2",
    title: "Mock Test #2",
    type: "crit-ps",
    subjects: {
      criticalThinking: "medium",
      problemSolving: "hard",
      mathematics: null,
    },
    passedCount: 12,
    durationMinutes: 60,
    questionCount: 30,
    maxScore: 120,
    result: null,
  },
  {
    id: "demo-mock-3",
    title: "Mock Test #3",
    type: "math",
    subjects: {
      criticalThinking: null,
      problemSolving: null,
      mathematics: "hard",
    },
    passedCount: 12,
    durationMinutes: 60,
    questionCount: 30,
    maxScore: 120,
    result: null,
  },
  {
    id: "demo-mock-4",
    title: "Mock Test #4",
    type: "full",
    subjects: {
      criticalThinking: "hard",
      problemSolving: "hard",
      mathematics: "easy",
    },
    passedCount: 1,
    durationMinutes: 120,
    questionCount: 60,
    maxScore: 240,
    result: {
      score: 211,
      completedAt: "2026-10-20T12:00:00Z",
      details: {
        sessionId: "NT-8941",
        timeSpentMinutes: 104,
        sections: [
          { id: "ct", score: 80, maxScore: 80 },
          { id: "ps", score: 75, maxScore: 80 },
          { id: "m", score: 56, maxScore: 80 },
        ],
        questions: demoCompletedQuestions(),
      },
    },
  },
];
