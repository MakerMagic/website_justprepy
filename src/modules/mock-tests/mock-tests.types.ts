export type MockTestType = "full" | "crit-ps" | "math";
export type MockDifficulty = "easy" | "medium" | "hard";
export type MockAction = "start" | "analyze" | "retake";

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
  result: { score: number; completedAt: string } | null;
  destinations?: Partial<Record<MockAction, string>>;
}

export interface MockFilters {
  status: "all" | "solved" | "unsolved";
  type: "all" | MockTestType;
}
