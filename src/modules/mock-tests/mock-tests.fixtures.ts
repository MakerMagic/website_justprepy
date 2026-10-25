import type { MockTest } from "./mock-tests.types";

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
    result: { score: 211, completedAt: "2026-10-20T12:00:00Z" },
  },
];
