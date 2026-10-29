import type {
  MockTest,
  MockResultSectionId,
  MockQuestionResultStatus,
} from "./mock-tests.types";

export const RESULT_SECTIONS = [
  { id: "ct", name: "Critical Thinking", subject: "criticalThinking" },
  { id: "ps", name: "Problem Solving", subject: "problemSolving" },
  { id: "m", name: "Mathematics", subject: "mathematics" },
] as const;
export const RESULT_STATUSES = [
  { id: "correct", label: "Correct", short: "c" },
  { id: "incorrect", label: "Incorrect", short: "i" },
  { id: "omitted", label: "Omitted", short: "o" },
] as const;
export type ResultFilters = {
  section: "all" | MockResultSectionId;
  status: "all" | MockQuestionResultStatus;
};
export function mockTestResultsHref(test: MockTest) {
  return test.result
    ? "/mock-tests/" +
        encodeURIComponent(test.id) +
        "/results?attempt=" +
        encodeURIComponent(test.result.completedAt)
    : null;
}
export function completedMockTest(
  tests: readonly MockTest[],
  id: string,
  attempt?: string,
) {
  const test = tests.find((item) => item.id === id && item.result !== null);
  return test && (!attempt || attempt === test.result!.completedAt)
    ? test
    : null;
}
export function mockResultModel(test: MockTest) {
  if (!test.result) return null;
  const details = test.result.details;
  const included = RESULT_SECTIONS.filter(
    (section) => test.subjects[section.subject] !== null,
  );
  const records = details?.questions;
  const validQuestions =
    records !== undefined &&
    records.length === test.questionCount &&
    new Set(records.map((row) => row.id)).size === test.questionCount &&
    new Set(records.map((row) => row.number)).size === test.questionCount &&
    records.every(
      (row) =>
        row.id.length > 0 &&
        Number.isInteger(row.number) &&
        row.number >= 1 &&
        row.number <= test.questionCount &&
        included.some((section) => section.id === row.section) &&
        RESULT_STATUSES.some((status) => status.id === row.status),
    );
  const questions = validQuestions
    ? [...records].sort((a, b) => a.number - b.number)
    : null;
  const counts = questions
    ? {
        correct: questions.filter((row) => row.status === "correct").length,
        incorrect: questions.filter((row) => row.status === "incorrect").length,
        omitted: questions.filter((row) => row.status === "omitted").length,
      }
    : null;
  const scores = details?.sections;
  const validScores =
    scores !== undefined &&
    scores.length === included.length &&
    new Set(scores.map((row) => row.id)).size === included.length &&
    scores.every(
      (row) =>
        included.some((section) => section.id === row.id) &&
        Number.isFinite(row.score) &&
        Number.isFinite(row.maxScore) &&
        row.maxScore > 0 &&
        row.score >= 0 &&
        row.score <= row.maxScore,
    ) &&
    scores.reduce((sum, row) => sum + row.score, 0) === test.result.score &&
    scores.reduce((sum, row) => sum + row.maxScore, 0) === test.maxScore;
  return {
    test,
    result: test.result,
    sessionId: details?.sessionId || test.id + "@" + test.result.completedAt,
    timeSpentMinutes:
      details &&
      Number.isFinite(details.timeSpentMinutes) &&
      details.timeSpentMinutes >= 0
        ? details.timeSpentMinutes
        : null,
    questions,
    counts,
    percentage: (count: number) =>
      test.questionCount
        ? ((count / test.questionCount) * 100).toFixed(1) + "%"
        : "—",
    sections: RESULT_SECTIONS.map((section) => ({
      ...section,
      included: included.some((item) => item.id === section.id),
      result: validScores
        ? (scores.find((item) => item.id === section.id) ?? null)
        : null,
    })),
  };
}
export type MockResultModel = NonNullable<ReturnType<typeof mockResultModel>>;
export function filterResultQuestions(
  model: MockResultModel,
  filters: ResultFilters,
) {
  const sectionQuestions =
    model.questions?.filter(
      (row) => filters.section === "all" || row.section === filters.section,
    ) ?? null;
  return {
    counts: sectionQuestions
      ? {
          all: sectionQuestions.length,
          correct: sectionQuestions.filter((row) => row.status === "correct")
            .length,
          incorrect: sectionQuestions.filter(
            (row) => row.status === "incorrect",
          ).length,
          omitted: sectionQuestions.filter((row) => row.status === "omitted")
            .length,
        }
      : null,
    questions:
      sectionQuestions?.filter(
        (row) => filters.status === "all" || row.status === filters.status,
      ) ?? null,
  };
}
