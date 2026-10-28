import { describe, expect, it } from "vitest";
import {
  accuracyLevel,
  classifyAttempts,
  createAnalytics,
  dateKey,
  dayDifference,
  formatSeriesValue,
  heatLevel,
  percent,
  seriesAxes,
  smoothPath,
  monotonePath,
} from "./analytics.logic";
const model = createAnalytics(new Date(2026, 9, 28, 19, 45));
describe("supplied Analytics reference behavior", () => {
  it("retains the source-generated activity and weighted accuracy rather than averaging daily percentages", () => {
    expect(model.all).toEqual({ att: 7102, cor: 5716, sol: 6104 });
    expect(model.week).toEqual({ att: 103, cor: 88, sol: 88 });
    expect(model.previousWeek).toEqual({ att: 48, cor: 42, sol: 39 });
    expect(model.accuracyChange).toBe(-3);
    expect(percent(model.all.cor, model.all.att)).toBe(80);
    expect(percent(0, 0)).toBeNull();
  });
  it("uses exactly the same daily activity for both axes and the heatmap", () => {
    const chart = model.general("Days");
    expect(chart.series[0].vals).toEqual([26, 8, 17, 8, 9, 12, 8]);
    expect(chart.series[1].vals).toEqual([83, 80, 89, 80, 91, 87, 89]);
    expect(chart.labels).toHaveLength(7);
    const cell = model.heatmap.cells.at(-1)!;
    expect(cell.attempted).toBe(9);
    expect(model.day(cell.date).att).toBe(cell.attempted);
  });
  it("covers the last 365 calendar days once and preserves the source heatmap thresholds", () => {
    expect(model.heatmap.cells).toHaveLength(365);
    expect(new Set(model.heatmap.cells.map((c) => dateKey(c.date))).size).toBe(
      365,
    );
    expect(dayDifference(model.now, model.heatmap.cells[0].date)).toBe(364);
    expect(model.heatmap.attempted).toBe(model.all.att);
    expect([0, 1, 12, 13, 35, 36].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3]);
  });
  it("keeps current-month weekly buckets, including the final partial week", () => {
    const month = createAnalytics(new Date(2026, 9, 30)),
      chart = month.general("Weeks");
    expect(chart.labels).toEqual([
      "Oct 1–7",
      "Oct 8–14",
      "Oct 15–21",
      "Oct 22–28",
      "Oct 29–30",
    ]);
    expect(chart.series[0].vals.reduce((a, b) => a! + b!, 0)).toBe(
      month.range(29, 0).sol,
    );
    expect(chart.series[1].pct).toBe(true);
  });
  it("preserves the source vocabulary totals for each period", () => {
    expect(model.vocabulary("Days").series[0].vals).toEqual([
      4, 3, 4, 6, 0, 1, 0,
    ]);
    expect(model.vocabulary("Weeks").series[0].vals).toEqual([22, 34, 31, 18]);
    expect(model.vocabulary("Months").series[0].vals).toEqual([
      120, 102, 82, 148, 120, 105,
    ]);
    expect(model.vocabulary("Months").full.at(-1)).toBe(
      "October 2026 (so far)",
    );
    expect(
      createAnalytics(new Date(2026, 0, 1)).vocabulary("Months").full[0],
    ).toBe("August 2025");
  });
  it("switches subject/period deterministically and preserves performance color cutoffs", () => {
    expect(
      model.topics("Critical Thinking", "Week").map((row) => row.value),
    ).toEqual([81, 74, 73, 76, 82, 69, 95]);
    expect(
      model.topics("Problem Solving", "Week").map((row) => row.name),
    ).toEqual([
      "Finding Procedures",
      "Identifying Similarity",
      "Relevant Selection",
    ]);
    expect(model.topics("Mathematics", "Month")).toHaveLength(5);
    expect(model.topics("Critical Thinking", "Day")).not.toEqual(
      model.topics("Critical Thinking", "Month"),
    );
    expect([59, 60, 74, 75].map(accuracyLevel)).toEqual(["r", "o", "o", "g"]);
    expect(model.caption("Week")).toBe("This week, Oct 26 – Nov 1");
  });
  it("compares chronological attempts only with the previous attempt of the same configuration", () => {
    expect(model.attempts.map((a) => [a.st, a.df])).toEqual([
      ["first", 0],
      ["first", 0],
      ["first", 0],
      ["down", -4],
      ["up", 4],
      ["down", -7],
      ["up", 13],
      ["same", 0],
      ["down", -7],
      ["up", 16],
    ]);
    expect(model.attempts[0].p).toBeCloseTo((58 / 240) * 100);
    expect(model.attempts[1].p).toBeCloseTo((70 / 120) * 100);
    const items = [
      { o: 0, t: "12:00", cfg: "math", s: 40 },
      { o: 0, t: "08:00", cfg: "math", s: 45 },
      { o: -1, t: "10:00", cfg: "full", s: 100 },
    ];
    const classified = classifyAttempts(items);
    expect(classified.map((a) => a.st)).toEqual(["first", "first", "down"]);
    expect(items[0].t).toBe("12:00");
  });
  it("retains separate left/right scales and source curve geometry", () => {
    const data = model.general("Days");
    expect(seriesAxes(data.series)).toEqual([
      { lo: 0, hi: 40 },
      { lo: 60, hi: 100 },
    ]);
    expect(
      smoothPath([
        [0, 20],
        [12, 8],
        [24, 14],
      ]),
    ).toBe("M0,20C2,18 8,9 12,8C16,7 22,13 24,14");
    expect(formatSeriesValue(data.series[1], null)).toBe("no data");
    expect(formatSeriesValue(model.vocabulary("Days").series[0], 1)).toBe(
      "1 word",
    );
  });
});

function cubicSegments(path: string) {
  const numbers = (
    path.match(/[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi) ?? []
  ).map(Number);
  const segments: number[][] = [];
  let start = numbers.slice(0, 2);
  for (let i = 2; i < numbers.length; i += 6) {
    const controls = numbers.slice(i, i + 6);
    segments.push([...start, ...controls]);
    start = controls.slice(4);
  }
  return segments;
}
function cubicY(segment: number[], t: number) {
  const u = 1 - t;
  return (
    u * u * u * segment[1] +
    3 * u * u * t * segment[3] +
    3 * u * t * t * segment[5] +
    t * t * t * segment[7]
  );
}
function expectBoundedPath(points: number[][]) {
  const segments = cubicSegments(monotonePath(points));
  expect(segments).toHaveLength(Math.max(0, points.length - 1));
  segments.forEach((segment, i) => {
    expect(segment.slice(0, 2)).toEqual(points[i]);
    expect(segment.slice(6)).toEqual(points[i + 1]);
    const low = Math.min(points[i][1], points[i + 1][1]),
      high = Math.max(points[i][1], points[i + 1][1]),
      direction = Math.sign(points[i + 1][1] - points[i][1]);
    // Bounding the control ordinates proves the full Bezier curve stays in range.
    for (const ordinate of [segment[1], segment[3], segment[5], segment[7]]) {
      expect(ordinate).toBeGreaterThanOrEqual(low - 1e-10);
      expect(ordinate).toBeLessThanOrEqual(high + 1e-10);
    }
    // A quadratic derivative reaches its minimum at an endpoint or its vertex.
    // Check those exactly, so no unsampled turning point can hide between samples.
    const d0 = 3 * (segment[3] - segment[1]),
      d1 = 3 * (segment[5] - segment[3]),
      d2 = 3 * (segment[7] - segment[5]),
      a = d0 - 2 * d1 + d2,
      b = 2 * (d1 - d0);
    const candidates = [0, 1];
    if (a !== 0) {
      const vertex = -b / (2 * a);
      if (vertex > 0 && vertex < 1) candidates.push(vertex);
    }
    for (const t of candidates) {
      expect((a * t * t + b * t + d0) * direction).toBeGreaterThanOrEqual(
        -1e-10,
      );
    }
    let previous = segment[1];
    for (let j = 0; j <= 200; j++) {
      const value = cubicY(segment, j / 200);
      expect(value).toBeGreaterThanOrEqual(low - 1e-10);
      expect(value).toBeLessThanOrEqual(high + 1e-10);
      expect((value - previous) * direction).toBeGreaterThanOrEqual(-1e-10);
      previous = value;
    }
  });
  return segments;
}
describe("Words Learned shape-preserving interpolation", () => {
  it.each([
    ["positive to zero", [8, 0]],
    ["zero to positive", [0, 8]],
    ["positive-zero-positive", [8, 0, 2]],
    ["consecutive zeros", [5, 0, 0, 0, 3]],
    ["constant values", [4, 4, 4, 4]],
    ["all zeros", [0, 0, 0, 0]],
    ["rapid increases and decreases", [1, 90, 0, 100, 2, 80, 0]],
    ["original daily regression", [4, 3, 4, 6, 0, 1, 0]],
  ] as const)("does not add extrema or negative counts: %s", (_, values) => {
    const points = values.map((value, index) => [index, value]);
    expectBoundedPath(points);
  });
  it("removes the confirmed Catmull-Rom undershoot without changing zero-valued knots", () => {
    const points = [4, 3, 4, 6, 0, 1, 0].map((y, x) => [x, y]);
    expect(cubicY(cubicSegments(smoothPath(points))[4], 0.185)).toBeLessThan(
      -0.21,
    );
    const corrected = expectBoundedPath(points);
    expect(corrected[3][7]).toBe(0);
    expect(corrected[4][1]).toBe(0);
    expect(corrected[4][3]).toBe(0);
  });
  it("is continuously differentiable with nonuniform x spacing", () => {
    const points = [
      [0, 1],
      [2, 3],
      [5, 8],
      [17, 10],
    ];
    const segments = expectBoundedPath(points);
    for (let i = 0; i < segments.length - 1; i++) {
      const a = segments[i],
        b = segments[i + 1],
        outgoing = (3 * (a[7] - a[5])) / (a[6] - a[0]),
        incoming = (3 * (b[3] - b[1])) / (b[6] - b[0]);
      expect(outgoing).toBeGreaterThan(0);
      expect(outgoing).toBeCloseTo(incoming, 12);
    }
  });
  it.each(["Days", "Weeks", "Months"] as const)(
    "bounds the rendered pixel-space curve by the zero baseline for %s",
    (period) => {
      const series = model.vocabulary(period).series[0],
        axis = seriesAxes([series])[0],
        baseline = 240;
      const points = series.vals.map((value, index) => [
        62 + index * 37,
        baseline - ((value! - axis.lo) / (axis.hi - axis.lo)) * 228,
      ]);
      const segments = expectBoundedPath(points);
      for (const segment of segments)
        for (const ordinate of [segment[1], segment[3], segment[5], segment[7]])
          expect(ordinate).toBeLessThanOrEqual(baseline + 1e-10);
      series.vals.forEach((value, i) => {
        if (value === 0) expect(points[i][1]).toBe(baseline);
      });
    },
  );
  it("handles empty, single-point and two-point charts without losing endpoints", () => {
    expect(monotonePath([])).toBe("");
    expect(monotonePath([[2, 0]])).toBe("M2,0");
    const [segment] = expectBoundedPath([
      [2, 3],
      [8, 9],
    ]);
    expect(cubicY(segment, 0.5)).toBe(6);
  });
});
