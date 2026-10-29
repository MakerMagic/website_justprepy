export type MockTestType = "full" | "crit-ps" | "math";
export type MockDifficulty = "easy" | "medium" | "hard";
export type MockAction = "start" | "analyze" | "retake";

export type MockResultSectionId = "ct" | "ps" | "m";
export type MockQuestionResultStatus = "correct" | "incorrect" | "omitted";
/** Completed-attempt view data; no grading or persistence is performed by this interface. */
export interface MockTestResultDetails {
  sessionId: string;
  timeSpentMinutes: number;
  sections: { id: MockResultSectionId; score: number; maxScore: number }[];
  questions: {
    id: string;
    number: number;
    section: MockResultSectionId;
    status: MockQuestionResultStatus;
  }[];
}

export interface MockTest {
  id: string;
  title: string;
  type: MockTestType;
  subjects: {
    criticalThinking: MockDifficulty | null;
    problemSolving: MockDifficulty | null;
    mathematics: MockDifficulty | null;
  };
  passedCount: number;
  durationMinutes: number;
  questionCount: number;
  maxScore: number;
  result: {
    score: number | null;
    completedAt: string;
    details?: MockTestResultDetails;
  } | null;
  destinations?: Partial<Record<MockAction, string>>;
}

export interface MockFilters {
  status: "all" | "solved" | "unsolved";
  type: "all" | MockTestType;
}
