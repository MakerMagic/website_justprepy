import type { MockAction, MockFilters, MockTest } from "./mock-tests.types";

export const defaultMockFilters: MockFilters = { status: "all", type: "all" };

export function filterMockTests(tests: MockTest[], filters: MockFilters) {
  return tests.filter(
    (test) =>
      (filters.type === "all" || test.type === filters.type) &&
      (filters.status === "all" ||
        (filters.status === "solved"
          ? test.result !== null
          : test.result === null)),
  );
}

export function summarizeMockTests(tests: MockTest[]) {
  const completed = tests.filter((test) => test.result !== null);
  const recent = [...completed]
    .sort(
      (a, b) =>
        Date.parse(b.result!.completedAt) - Date.parse(a.result!.completedAt),
    )
    .slice(0, 3);
  return {
    completed: completed.length,
    recent,
    average: recent.length
      ? Math.round(
          recent.reduce((total, test) => total + test.result!.score, 0) /
            recent.length,
        )
      : null,
  };
}

export function mockTestActions(test: MockTest): MockAction[] {
  return test.result ? ["analyze", "retake"] : ["start"];
}
