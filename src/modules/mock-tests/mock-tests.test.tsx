import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { StatisticCard } from "../../components/statistic-card";
import { Sidebar } from "../questions/sidebar";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  defaultMockFilters,
  filterMockTests,
  mockTestActions,
  summarizeMockTests,
} from "./mock-tests.logic";
import { MockTestCard, MockTests } from "./mock-tests";
import type { MockFilters, MockTest } from "./mock-tests.types";

const route = vi.hoisted(() => ({ pathname: "/mock-tests" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

describe("mock-test catalogue", () => {
  it("has consistent, replaceable illustrative records", () => {
    expect(new Set(demoMockTests.map((test) => test.id)).size).toBe(
      demoMockTests.length,
    );
    for (const test of demoMockTests) {
      expect(test.questionCount).toBeGreaterThan(0);
      expect(test.durationMinutes).toBeGreaterThan(0);
      expect(test.passedCount).toBeGreaterThanOrEqual(test.result ? 1 : 0);
      expect(test.result?.score ?? 0).toBeLessThanOrEqual(test.maxScore);
      expect(test.type === "math").toBe(
        test.subjects.criticalThinking === null &&
          test.subjects.problemSolving === null,
      );
      expect(test.type === "crit-ps").toBe(test.subjects.mathematics === null);
    }
  });
  for (const status of ["all", "solved", "unsolved"] as const) {
    for (const type of ["all", "full", "crit-ps", "math"] as const) {
      it(`combines ${status} and ${type} filters`, () => {
        const filters: MockFilters = { status, type };
        const result = filterMockTests(demoMockTests, filters);
        const expected = demoMockTests.filter(
          (test) =>
            (type === "all" || test.type === type) &&
            (status === "all" ||
              Boolean(test.result) === (status === "solved")),
        );
        expect(result.map((test) => test.id)).toEqual(
          expected.map((test) => test.id),
        );
      });
    }
  }
  it("resets to all records and preserves source data", () => {
    const before = JSON.stringify(demoMockTests);
    expect(filterMockTests(demoMockTests, defaultMockFilters)).toEqual(
      demoMockTests,
    );
    filterMockTests(demoMockTests, { status: "solved", type: "math" });
    summarizeMockTests(demoMockTests);
    expect(JSON.stringify(demoMockTests)).toBe(before);
  });
  it("derives statistics and handles missing results without inventing zeros", () => {
    expect(summarizeMockTests(demoMockTests)).toMatchObject({
      completed: 1,
      average: 211,
    });
    expect(summarizeMockTests([])).toEqual({
      completed: 0,
      average: null,
      recent: [],
    });
    expect(summarizeMockTests(demoMockTests.slice(0, 3)).average).toBeNull();
  });
  it("averages only the three most recent completions, including a genuine zero", () => {
    const tests: MockTest[] = [20, 40, 0, 100].map((score, index) => ({
      ...demoMockTests[0],
      id: `fixture-${index}`,
      result: { score, completedAt: `2026-10-${20 + index}T12:00:00Z` },
    }));
    const summary = summarizeMockTests(tests);
    expect(summary.completed).toBe(4);
    expect(summary.average).toBe(47);
    expect(summary.recent.map((test) => test.id)).toEqual([
      "fixture-3",
      "fixture-2",
      "fixture-1",
    ]);
  });
  it("keeps all subject rows, exclusions, duration, count and unattempted score", () => {
    const html = renderToStaticMarkup(
      <MockTestCard test={demoMockTests[2]} onAction={() => {}} />,
    );
    for (const text of [
      "Critical Thinking",
      "Problem Solving",
      "Mathematics",
      "Excluded",
      "60",
      "Mins",
      "30",
      "Questions",
      "Your Score",
      "?",
      "120",
      "Start Test",
    ])
      expect(html).toContain(text);
    expect(html.match(/data-excluded="true"/g)).toHaveLength(2);
    expect(html).toContain(
      'class="review-difficulty mock-difficulty" data-state="hard"',
    );
    expect(html).not.toContain("Analyze");
    expect(mockTestActions(demoMockTests[2])).toEqual(["start"]);
  });
  it("renders completed scores and the supported completed action set", () => {
    const html = renderToStaticMarkup(
      <MockTestCard test={demoMockTests[3]} onAction={() => {}} />,
    );
    expect(html).toContain('data-completed="true"');
    for (const text of ["211", "240", "Analyze", "Retake"])
      expect(html).toContain(text);
    expect(html).not.toContain("Start Test");
    expect(mockTestActions(demoMockTests[3])).toEqual(["analyze", "retake"]);
  });
  it("omits simulation labels from every card while retaining test titles and counts", () => {
    for (const test of demoMockTests) {
      const html = renderToStaticMarkup(
        <MockTestCard test={test} onAction={() => {}} />,
      );
      expect(html).toContain(test.title);
      expect(html).toContain(test.passedCount + " Passed");
      expect(html).not.toContain("mock-test-type");
      expect(html).not.toMatch(
        /Full Simulation|Sectional Simulation|Sectional Focus/i,
      );
    }
  });
  it("links only provided action destinations", () => {
    const test = {
      ...demoMockTests[0],
      destinations: { start: "/fixture-test" },
    };
    const html = renderToStaticMarkup(
      <MockTestCard test={test} onAction={() => {}} />,
    );
    expect(html).toContain('href="/fixture-test"');
    expect(html).not.toContain('aria-haspopup="dialog"');
    expect(
      renderToStaticMarkup(
        <MockTestCard test={demoMockTests[0]} onAction={() => {}} />,
      ),
    ).toContain('aria-haspopup="dialog"');
  });
  it("uses one shared statistic control with the original Question Bank anatomy", () => {
    const html = renderToStaticMarkup(
      <StatisticCard
        label="Tests Passed"
        value={1}
        motif="check"
        onClick={() => {}}
      />,
    );
    expect(html).toContain('class="stat-card"');
    expect(html).toContain('class="stat-label">Tests Passed');
    expect(html).toContain('class="stat-value">1');
    expect(html).toContain('class="stat-motif"');
    expect(html).toContain('aria-haspopup="dialog"');
  });
  it("renders every requested filter and derives availability from supplied data", () => {
    const html = renderToStaticMarkup(
      <MockTests
        tests={demoMockTests.slice(0, 2)}
        profile={demoQuestionBank.profile}
        telegramUrl={null}
      />,
    );
    for (const label of [
      "Mock Tests",
      "Filter Tests",
      "All",
      "Solved",
      "Unsolved",
      "Full",
      "Crit + PS",
      "Math",
      "Average Last 3",
      "Tests Passed",
    ])
      expect(html).toContain(label);
    expect(html).toMatch(
      /class="mock-availability" role="status">2 Available<\/span>/,
    );
    expect(html.match(/class="mock-card"/g)).toHaveLength(2);
    expect(html).toContain("Illustrative tests and results");
    expect(html).toContain("NUET Preparation");
  });
  it.each(["/", "/practice", "/mock-tests"])(
    "keeps navigation consistent at %s",
    (pathname) => {
      route.pathname = pathname;
      const html = renderToStaticMarkup(
        <Sidebar profile={demoQuestionBank.profile} />,
      );
      const active = pathname === "/mock-tests" ? "/mock-tests" : "/";
      const desktop =
        html.match(/<a[^>]*class="nav-item is-active"[^>]*>/g) ?? [];
      expect(desktop).toHaveLength(1);
      expect(desktop[0]).toContain(`href="${active}"`);
      expect(html.match(/href="\/mock-tests"/g)).toHaveLength(2);
      expect(html.match(/aria-current="page"/g)).toHaveLength(2);
      route.pathname = "/mock-tests";
    },
  );
});
