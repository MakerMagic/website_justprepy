import { describe, expect, it } from "vitest";
import { demoMockTests } from "../mock-tests/mock-tests.fixtures";
import { createAnalytics, dateKey, TOPICS } from "./analytics.logic";
import {
  createPopupAnalytics,
  popupTimeByTopic,
  formatPopupTime,
  popupLatestMockTests,
  POPUP_CONFIGURATIONS,
  POPUP_RAW_ATTEMPTS,
  popupErrorRows,
  popupTopicRows,
  togglePopupMetric,
  type PopupMetric,
} from "./analytics-popups.logic";
const reference = new Date(2026, 9, 28, 12);
const model = createPopupAnalytics(reference);
describe("supplied Analytics pop-up behavior", () => {
  it("matches the source's illustrative totals without changing the main Analytics model", () => {
    const main = createAnalytics(reference),
      before = JSON.stringify(main.vocabulary("Days"));
    expect(model.totals).toEqual({
      att: 7102,
      cor: 5716,
      par: 611,
      wrg: 775,
      lrn: 1374,
      flp: 15327,
      rev: 6128,
      rec: 4871,
    });
    expect(JSON.stringify(main.vocabulary("Days"))).toBe(before);
    expect(main.vocabulary("Days").series[0].vals).toEqual([
      4, 3, 4, 6, 0, 1, 0,
    ]);
    expect(reference.getHours()).toBe(12);
  });
  it("counts every attempted question in exactly one outcome across all 365 days", () => {
    expect(model.allDates).toHaveLength(365);
    expect(new Set(model.allDates.map(dateKey)).size).toBe(365);
    for (const date of model.allDates) {
      const day = model.day(date);
      expect(day.att).toBe(day.cor + day.par + day.wrg);
      expect(
        Object.values(day).every(
          (value) => Number.isInteger(value) && value >= 0,
        ),
      ).toBe(true);
      expect(day.rec).toBeLessThanOrEqual(day.rev);
    }
  });
  it.each([
    ["Days", [4, 3, 4, 6, 9, 1, 7], [62, 51, 67, 49, 65, 14, 52]],
    ["Weeks", [22, 34, 31, 34], [283, 287, 171, 360]],
    [
      "Months",
      [120, 102, 82, 148, 120, 121],
      [1371, 1165, 1460, 1380, 1135, 1101],
    ],
  ] as const)(
    "preserves the reference's %s vocabulary and flip values",
    (period, learned, flipped) => {
      const buckets = model.buckets(period);
      expect(buckets.map((bucket) => model.sum(bucket.dates, "lrn"))).toEqual(
        learned,
      );
      expect(buckets.map((bucket) => model.sum(bucket.dates, "flp"))).toEqual(
        flipped,
      );
      for (const bucket of buckets)
        expect(model.sum(bucket.dates, "att")).toBe(
          model.sum(bucket.dates, "cor") +
            model.sum(bucket.dates, "par") +
            model.sum(bucket.dates, "wrg"),
        );
    },
  );
  it("uses a weighted retention rate and preserves missing data as missing", () => {
    expect(model.retention(model.allDates)).toBe(79);
    expect(model.retention([])).toBeNull();
    for (const period of ["Days", "Weeks", "Months"] as const)
      for (const bucket of model.buckets(period)) {
        const reviewed = model.sum(bucket.dates, "rev"),
          recalled = model.sum(bucket.dates, "rec");
        expect(model.retention(bucket.dates)).toBe(
          reviewed ? Math.round((recalled / reviewed) * 100) : null,
        );
      }
  });
  it("keeps month boundaries, the partial current month and weekly captions", () => {
    const first = createPopupAnalytics(new Date(2026, 0, 1));
    expect(first.buckets("Months")[0].full).toBe("August 2025");
    expect(first.buckets("Months").at(-1)?.dates).toHaveLength(1);
    expect(model.buckets("Weeks").at(-1)?.label).toBe("Oct 22–28");
    expect(model.caption("Week")).toBe("This week, Oct 26 – Nov 1");
  });
  it("never allows the final selected Question Bank metric to be deselected", () => {
    let selected: PopupMetric[] = ["att", "cor", "par", "wrg"];
    selected = togglePopupMetric(selected, "att");
    selected = togglePopupMetric(selected, "cor");
    selected = togglePopupMetric(selected, "par");
    expect(selected).toEqual(["wrg"]);
    expect(togglePopupMetric(selected, "wrg")).toEqual(["wrg"]);
    expect(togglePopupMetric(selected, "att")).toEqual(["wrg", "att"]);
    expect(selected).toEqual(["wrg"]);
  });
  it("compares each source attempt only with the preceding attempt of the same configuration", () => {
    expect(model.attempts).toHaveLength(23);
    expect(
      model.attempts.filter((attempt) => attempt.st === "first"),
    ).toHaveLength(3);
    for (const attempt of model.attempts)
      if (attempt.pv) {
        expect(attempt.pv.cfg).toBe(attempt.cfg);
        expect(attempt.df).toBe(attempt.s - attempt.pv.s);
        expect(attempt.st).toBe(
          attempt.df > 0 ? "up" : attempt.df < 0 ? "down" : "same",
        );
      }
    expect(
      model.latest.map((attempt) => [attempt.cfg, attempt.s, attempt.df]),
    ).toEqual([
      ["math", 71, 14],
      ["full", 121, 17],
      ["ctps", 66, -4],
    ]);
    expect(
      model.attempts
        .filter((attempt) => attempt.st === "same")
        .map((attempt) => attempt.s),
    ).toEqual([48, 104]);
    expect(POPUP_RAW_ATTEMPTS[0]).toEqual([-42, "09:00", "full", 58]);
    expect(POPUP_CONFIGURATIONS.full.m).toBe(240);
    expect(POPUP_CONFIGURATIONS.math.m).toBe(120);
  });
  it("preserves the source's subject accuracy, error rates and attempted denominators", () => {
    for (const subject of [
      "Critical Thinking",
      "Problem Solving",
      "Mathematics",
    ] as const) {
      const accuracy = popupTopicRows(subject, "Month"),
        errors = popupErrorRows(subject);
      errors.forEach((row, i) => {
        expect(row.value + accuracy[i].value).toBe(100);
        expect(row.attempted).toBeGreaterThanOrEqual(40);
        expect(row.attempted).toBeLessThan(120);
      });
    }
    expect(
      popupTopicRows("Critical Thinking", "Week").map((row) => row.value),
    ).toEqual([81, 74, 73, 76, 82, 69, 95]);
    expect(popupTopicRows("Problem Solving", "Day")).toHaveLength(3);
    expect(popupTopicRows("Mathematics", "Day")).toHaveLength(5);
  });
});

describe("Mock Tests popup reference additions", () => {
  it.each([
    ["Critical Thinking", "Last Week", [94, 94, 86, 82, 80, 78, 74], 84, 120],
    ["Critical Thinking", "Last Month", [95, 91, 90, 86, 78, 69, 65], 82, 120],
    ["Problem Solving", "Last Week", [118, 106, 84], 103, 150],
    ["Problem Solving", "Last Month", [117, 101, 80], 99, 150],
    ["Mathematics", "Last Week", [110, 88, 78, 67, 66], 82, 150],
    ["Mathematics", "Last Month", [113, 97, 86, 66, 56], 84, 150],
  ] as const)(
    "matches source timing values for %s / %s",
    (subject, period, seconds, average, maximum) => {
      const chart = popupTimeByTopic(subject, period);
      expect(chart.rows.map((row) => row.seconds)).toEqual(seconds);
      expect(chart.average).toBe(average);
      expect(chart.maximum).toBe(maximum);
      expect(chart.rows.map((row) => row.name).sort()).toEqual(
        TOPICS[subject].map(([name]) => name).sort(),
      );
      expect(
        chart.rows.every(
          (row) => row.seconds > 0 && row.seconds < chart.maximum,
        ),
      ).toBe(true);
      expect(popupTimeByTopic(subject, period)).toEqual(chart);
    },
  );
  it("keeps each topic attached to its own duration when sorted or switched", () => {
    expect(popupTimeByTopic("Critical Thinking", "Last Week").rows).toEqual([
      { name: "Assessing the Impact", seconds: 94 },
      { name: "Detecting Flaws", seconds: 94 },
      { name: "Applying Principles", seconds: 86 },
      { name: "Drawing a Conclusion", seconds: 82 },
      { name: "Matching Arguments", seconds: 80 },
      { name: "Identifying an Assumption", seconds: 78 },
      { name: "Main Conclusion", seconds: 74 },
    ]);
    expect(popupTimeByTopic("Mathematics", "Last Month").rows).toEqual([
      { name: "Geometry", seconds: 113 },
      { name: "Ratio and Proportion", seconds: 97 },
      { name: "Algebra", seconds: 86 },
      { name: "Numbers", seconds: 66 },
      { name: "Units", seconds: 56 },
    ]);
  });
  it.each([
    [0, "0s"],
    [56, "56s"],
    [60, "1m 00s"],
    [94, "1m 34s"],
    [150, "2m 30s"],
  ])("formats %s seconds as %s", (seconds, text) => {
    expect(formatPopupTime(Number(seconds))).toBe(text);
  });
  it("reuses main-page metadata and subject exclusions without modifying source attempts or catalogue", () => {
    const catalogueBefore = JSON.stringify(demoMockTests),
      attemptsBefore = JSON.stringify(model.attempts);
    const cards = popupLatestMockTests(model);
    expect(
      cards.map((card) => [
        card.title,
        card.result?.score,
        card.maxScore,
        card.passedCount,
        card.durationMinutes,
        card.questionCount,
      ]),
    ).toEqual([
      ["Mock Test #3", 71, 120, 12, 60, 30],
      ["Mock Test #1", 121, 240, 105, 120, 60],
      ["Mock Test #2", 66, 120, 12, 60, 30],
    ]);
    expect(cards[0].subjects).toEqual({
      criticalThinking: null,
      problemSolving: null,
      mathematics: "hard",
    });
    expect(cards[2].subjects).toEqual({
      criticalThinking: "medium",
      problemSolving: "hard",
      mathematics: null,
    });
    expect(new Set(cards.map((card) => card.id)).size).toBe(3);
    cards.forEach((card, i) => {
      const catalogue = demoMockTests.find((test) => test.type === card.type)!;
      expect(card.subjects).toEqual(catalogue.subjects);
      expect(card.subjects).not.toBe(catalogue.subjects);
      expect(card.destinations).toEqual(catalogue.destinations);
      expect(new Date(card.result!.completedAt).getDate()).toBe(
        model.latest[i].date.getDate(),
      );
    });
    expect(JSON.stringify(demoMockTests)).toBe(catalogueBefore);
    expect(JSON.stringify(model.attempts)).toBe(attemptsBefore);
  });
});
