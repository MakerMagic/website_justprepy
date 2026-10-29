import { describe, it, expect, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MockTest } from "./mock-tests.types";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  completedMockTest,
  mockTestResultsHref,
  mockResultModel,
  filterResultQuestions,
  RESULT_SECTIONS,
  RESULT_STATUSES,
} from "./mock-test-results.logic";
import { MockTestResults } from "./mock-test-results";
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "test-results-font" }),
}));
const test = demoMockTests[3];
const model = mockResultModel(test)!;
describe("completed Mock Test Results integration", () => {
  it("preserves the existing completion and uses the owner-authorized temporary details", () => {
    expect(test.result).toMatchObject({
      score: 211,
      completedAt: "2026-10-20T12:00:00Z",
    });
    expect(model.counts).toEqual({ correct: 53, incorrect: 5, omitted: 2 });
    expect(
      Object.values(model.counts!).reduce((sum, count) => sum + count, 0),
    ).toBe(test.questionCount);
    expect(model.questions).toHaveLength(60);
    expect(model.timeSpentMinutes).toBe(104);
    expect(model.sections.map((section) => section.result?.score)).toEqual([
      80, 75, 56,
    ]);
    expect(
      model.sections.reduce((sum, section) => sum + section.result!.score, 0),
    ).toBe(211);
    expect(model.percentage(53)).toBe("88.3%");
    expect(model.percentage(5)).toBe("8.3%");
    expect(model.percentage(2)).toBe("3.3%");
  });
  it("routes by both test identity and completion, never falling back to another test", () => {
    const second: MockTest = {
      ...test,
      id: "another-completed-test",
      title: "Another Test",
      result: { ...test.result!, completedAt: "2026-10-22T08:00:00Z" },
    };
    const tests = [test, second, ...demoMockTests.slice(0, 3)];
    expect(mockTestResultsHref(test)).toBe(
      "/mock-tests/demo-mock-4/results?attempt=2026-10-20T12%3A00%3A00Z",
    );
    expect(mockTestResultsHref(second)).toBe(
      "/mock-tests/another-completed-test/results?attempt=2026-10-22T08%3A00%3A00Z",
    );
    expect(completedMockTest(tests, test.id, test.result!.completedAt)).toBe(
      test,
    );
    expect(
      completedMockTest(tests, second.id, second.result!.completedAt),
    ).toBe(second);
    expect(
      completedMockTest(tests, test.id, second.result!.completedAt),
    ).toBeNull();
    expect(completedMockTest(tests, "missing")).toBeNull();
    expect(completedMockTest(tests, demoMockTests[0].id)).toBeNull();
    expect(mockTestResultsHref(demoMockTests[0])).toBeNull();
    expect(mockResultModel(demoMockTests[0])).toBeNull();
  });
  it("renders separate titles, session IDs and values for different completed results", () => {
    const second: MockTest = {
      ...test,
      id: "sectional-result",
      title: "Sectional Test",
      type: "math",
      maxScore: 120,
      questionCount: 3,
      subjects: {
        criticalThinking: null,
        problemSolving: null,
        mathematics: "hard",
      },
      result: {
        score: 40,
        completedAt: "2026-10-23T08:00:00Z",
        details: {
          sessionId: "MATH-2",
          timeSpentMinutes: 12,
          sections: [{ id: "m", score: 40, maxScore: 120 }],
          questions: [
            { id: "m1", number: 1, section: "m", status: "correct" },
            { id: "m2", number: 2, section: "m", status: "incorrect" },
            { id: "m3", number: 3, section: "m", status: "omitted" },
          ],
        },
      },
    };
    const firstHtml = renderToStaticMarkup(
      <MockTestResults test={test} illustrative />,
    );
    const secondHtml = renderToStaticMarkup(<MockTestResults test={second} />);
    expect(firstHtml).toContain("Mock Test #4 results");
    expect(firstHtml).toContain("Session #NT-8941");
    expect(firstHtml).toContain("Illustrative test result details.");
    expect(firstHtml).toContain("88.3%");
    expect(firstHtml.match(/class="stat-card"/g)).toHaveLength(3);
    expect(secondHtml).toContain("Sectional Test results");
    expect(secondHtml).toContain("Session #MATH-2");
    expect(secondHtml).toContain("33.3%");
    expect(secondHtml).not.toContain("NT-8941");
    expect(secondHtml.match(/Not included in this test/g)).toHaveLength(4);
    expect(secondHtml).not.toContain("Illustrative test result details.");
    expect(mockResultModel(second)?.counts).toEqual({
      correct: 1,
      incorrect: 1,
      omitted: 1,
    });
  });
  for (const section of [
    "all",
    ...RESULT_SECTIONS.map((item) => item.id),
  ] as const) {
    for (const status of [
      "all",
      ...RESULT_STATUSES.map((item) => item.id),
    ] as const) {
      it("preserves source filtering for " + section + " / " + status, () => {
        const before = JSON.stringify(test);
        const filtered = filterResultQuestions(model, { section, status });
        const inSection = model.questions!.filter(
          (row) => section === "all" || row.section === section,
        );
        expect(filtered.questions).toEqual(
          inSection.filter((row) => status === "all" || row.status === status),
        );
        expect(filtered.counts?.all).toBe(inSection.length);
        expect(
          filtered.counts!.correct +
            filtered.counts!.incorrect +
            filtered.counts!.omitted,
        ).toBe(inSection.length);
        expect(JSON.stringify(test)).toBe(before);
      });
    }
  }
  it("keeps question positions and identities stable through all filters", () => {
    const questions = model.questions!;
    expect(questions.map((row) => row.number)).toEqual(
      Array.from({ length: 60 }, (_, i) => i + 1),
    );
    expect(new Set(questions.map((row) => row.id)).size).toBe(60);
    expect(
      filterResultQuestions(model, { section: "ct", status: "omitted" })
        .questions,
    ).toEqual([]);
    expect(
      filterResultQuestions(model, { section: "ps", status: "incorrect" })
        .questions,
    ).toHaveLength(1);
    expect(
      filterResultQuestions(model, { section: "m", status: "omitted" })
        .questions,
    ).toHaveLength(2);
  });
  it("does not invent omitted or zero values for incomplete or invalid result details", () => {
    const unknown = {
      ...test,
      result: { score: 0, completedAt: test.result!.completedAt },
    };
    const unknownModel = mockResultModel(unknown)!;
    expect(unknownModel.result.score).toBe(0);
    expect(unknownModel.questions).toBeNull();
    expect(unknownModel.counts).toBeNull();
    expect(unknownModel.timeSpentMinutes).toBeNull();
    expect(
      unknownModel.sections.every((section) => section.result === null),
    ).toBe(true);
    expect(
      filterResultQuestions(unknownModel, { section: "all", status: "omitted" })
        .counts,
    ).toBeNull();
    const truncated = {
      ...test,
      result: {
        ...test.result!,
        details: {
          ...test.result!.details!,
          questions: test.result!.details!.questions.slice(1),
        },
      },
    };
    expect(mockResultModel(truncated)?.counts).toBeNull();
    const duplicate = structuredClone(test);
    duplicate.result!.details!.questions[1].number = 1;
    expect(mockResultModel(duplicate)?.questions).toBeNull();
    const badScore = structuredClone(test);
    badScore.result!.details!.sections[0].score = 0;
    expect(
      mockResultModel(badScore)?.sections.every(
        (section) => section.result === null,
      ),
    ).toBe(true);
    const html = renderToStaticMarkup(<MockTestResults test={unknown} />);
    expect(html).toContain("Unavailable");
    expect(html).not.toContain("0.0%");
  });
});
