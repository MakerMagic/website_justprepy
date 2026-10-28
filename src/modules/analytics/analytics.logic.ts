// Algorithms and illustrative activity are ported from the supplied Analytics HTML.
export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const SHORT_MONTHS = MONTHS.map((month) => month.slice(0, 3));
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const LONG_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export type Period = "Day" | "Week" | "Month";
export type LinePeriod = "Days" | "Weeks" | "Months";
export type Subject = "Critical Thinking" | "Problem Solving";
export type Activity = { att: number; cor: number; sol: number };
export type LineSeries = {
  name: string;
  vals: (number | null)[];
  color: string;
  pct?: boolean;
  sq?: boolean;
  area?: boolean;
  format: "questions" | "questions in the week" | "percent" | "words";
};
export type ChartData = {
  labels: string[];
  full: string[];
  aria: string;
  series: LineSeries[];
};
export const TOPICS = {
  "Critical Thinking": [
    ["Applying Principles", 84],
    ["Drawing a Conclusion", 78],
    ["Identifying an Assumption", 72],
    ["Assessing the Impact", 69],
    ["Matching Arguments", 82],
    ["Detecting Flaws", 64],
    ["Main Conclusion", 88],
  ],
  "Problem Solving": [
    ["Finding Procedures", 74],
    ["Identifying Similarity", 67],
    ["Relevant Selection", 79],
  ],
  Mathematics: [
    ["Units", 88],
    ["Numbers", 76],
    ["Ratio and Proportion", 63],
    ["Algebra", 70],
    ["Geometry", 81],
  ],
} satisfies Record<string, [string, number][]>;
export const CONFIGURATIONS = {
  full: { n: "Full Mock Test", m: 240 },
  ctps: { n: "Critical Thinking + Problem Solving sectional", m: 120 },
  math: { n: "Mathematics sectional", m: 120 },
};
export type Configuration = keyof typeof CONFIGURATIONS;
export const RAW_ATTEMPTS: [number, string, Configuration, number][] = [
  [-26, "09:00", "full", 58],
  [-19, "10:15", "ctps", 70],
  [-12, "09:00", "math", 78],
  [-12, "12:30", "ctps", 66],
  [-12, "18:00", "full", 62],
  [-8, "11:00", "full", 55],
  [-5, "16:40", "math", 91],
  [-2, "10:00", "full", 55],
  [-1, "08:00", "math", 84],
  [0, "08:30", "ctps", 82],
];
export const RANKING = { rank: 12, total: 1248, title: "Sharp Solver" };
export function dateKey(date: Date) {
  return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
}
export function formatDay(date: Date) {
  return SHORT_MONTHS[date.getMonth()] + " " + date.getDate();
}
export function dayDifference(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 864e5);
}
export function hash(text: string) {
  let x = 2166136261;
  for (const c of text) {
    x ^= c.charCodeAt(0);
    x = Math.imul(x, 16777619);
  }
  return x >>> 0;
}
export function random(text: string) {
  let t = (hash(text) + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function percent(correct: number, attempted: number) {
  return attempted ? Math.round((correct / attempted) * 100) : null;
}
export function accuracyLevel(value: number) {
  return value >= 75 ? "g" : value >= 60 ? "o" : "r";
}
export function heatLevel(attempted: number) {
  return [1, 13, 36].filter((threshold) => attempted >= threshold).length;
}
export function classifyAttempts<
  T extends { o: number; t: string; cfg: string; s: number },
>(items: T[]) {
  const last: Record<string, T> = {};
  return items
    .slice()
    .sort((a, b) => a.o - b.o || a.t.localeCompare(b.t))
    .map((a) => {
      const pv = last[a.cfg];
      last[a.cfg] = a;
      const df = pv ? a.s - pv.s : 0;
      const st: "first" | "up" | "down" | "same" = !pv
        ? "first"
        : df > 0
          ? "up"
          : df < 0
            ? "down"
            : "same";
      return { ...a, pv, df, st };
    });
}
export function smoothPath(points: number[][]) {
  if (!points.length) return "";
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i - 1] || points[i],
      b = points[i],
      c = points[i + 1],
      e = points[i + 2] || c;
    d += `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (e[0] - b[0]) / 6},${c[1] - (e[1] - b[1]) / 6} ${c[0]},${c[1]}`;
  }
  return d;
}
/** Shape-preserving cubic Hermite interpolation for the Words Learned count series.
 * Harmonic tangents are zero at extrema and bounded by twice each adjacent secant.
 * Each Bezier control ordinate stays inside its segment's endpoint range; the
 * curve therefore cannot overshoot either endpoint or cross the zero baseline.
 */
export function monotonePath(points: number[][]) {
  if (!points.length) return "";
  const secants = points
    .slice(1)
    .map((point, i) => (point[1] - points[i][1]) / (point[0] - points[i][0]));
  const tangents = points.map((_, i) => {
    if (i === 0) return secants[0] ?? 0;
    if (i === points.length - 1) return secants[i - 1];
    const left = secants[i - 1],
      right = secants[i];
    if (left === 0 || right === 0 || Math.sign(left) !== Math.sign(right))
      return 0;
    return 2 / (1 / left + 1 / right);
  });
  let result = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = points[i],
      [x1, y1] = points[i + 1],
      third = (x1 - x0) / 3;
    result += `C${x0 + third},${y0 + tangents[i] * third} ${x1 - third},${y1 - tangents[i + 1] * third} ${x1},${y1}`;
  }
  return result;
}
export function seriesAxes(series: LineSeries[]) {
  return series.map((s) => {
    const values = s.vals.filter((v): v is number => v !== null);
    if (s.pct)
      return {
        lo: [80, 60, 40, 20, 0].find((q) => q <= Math.min(...values) - 5) ?? 0,
        hi: 100,
      };
    const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].find(
      (q) => q >= Math.max(...values) / 4,
    )!;
    return { lo: 0, hi: step * 4 };
  });
}
export function formatSeriesValue(series: LineSeries, value: number | null) {
  if (value === null) return "no data";
  if (series.format === "percent") return value + "%";
  if (series.format === "words")
    return value + " word" + (value === 1 ? "" : "s");
  return value + " " + series.format;
}
export function createAnalytics(reference: Date) {
  const now = new Date(reference);
  now.setHours(0, 0, 0, 0);
  const ago = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };
  const memo = new Map<string, Activity>();
  const day = (d: Date): Activity => {
    const k = dateKey(d),
      cached = memo.get(k);
    if (cached) return cached;
    const back = dayDifference(now, d),
      wk = d.getDay() % 6 === 0,
      k0 = random("a" + k),
      forced = back < 7;
    let att = 0;
    if (forced || k0 < (wk ? 0.45 : 0.7))
      att =
        Math.floor(3 + Math.pow(random("n" + k), 1.7) * (wk ? 55 : 78)) +
        (forced ? 6 : 0);
    const acc = Math.min(
      0.97,
      0.68 + 0.2 * random("c" + k) + 0.06 * (1 - Math.min(back, 365) / 365),
    );
    const result = {
      att,
      cor: Math.round(att * acc),
      sol: Math.round(att * (0.8 + 0.12 * random("s" + k))),
    };
    memo.set(k, result);
    return result;
  };
  const range = (a: number, b: number) => {
    const total = { att: 0, cor: 0, sol: 0 };
    for (let i = a; i >= b; i--) {
      const r = day(ago(i));
      total.att += r.att;
      total.cor += r.cor;
      total.sol += r.sol;
    }
    return total;
  };
  const all = range(364, 0),
    week = range(6, 0),
    previousWeek = range(13, 7);
  const general = (period: Exclude<LinePeriod, "Months">): ChartData => {
    const labels: string[] = [],
      full: string[] = [],
      solved: number[] = [],
      accuracy: (number | null)[] = [];
    if (period === "Days")
      for (let i = 6; i >= 0; i--) {
        const d = ago(i),
          r = day(d);
        labels.push(WEEKDAYS[d.getDay()] + " " + d.getDate());
        full.push(
          LONG_WEEKDAYS[d.getDay()] +
            ", " +
            MONTHS[d.getMonth()] +
            " " +
            d.getDate(),
        );
        solved.push(r.sol);
        accuracy.push(percent(r.cor, r.att));
      }
    else {
      const dim = now.getDate();
      for (let s = 1; s <= dim; s += 7) {
        const e = Math.min(s + 6, dim),
          r = range(dim - s, dim - e);
        labels.push(`${SHORT_MONTHS[now.getMonth()]} ${s}–${e}`);
        full.push(
          `Week ${Math.ceil(s / 7)} · ${MONTHS[now.getMonth()]} ${s}–${e}`,
        );
        solved.push(r.sol);
        accuracy.push(percent(r.cor, r.att));
      }
    }
    return {
      labels,
      full,
      aria: "Questions solved and accuracy over time",
      series: [
        {
          name: "Questions solved",
          vals: solved,
          color: "var(--c-solved)",
          format: period === "Days" ? "questions" : "questions in the week",
        },
        {
          name: "Accuracy",
          vals: accuracy,
          color: "var(--c-acc)",
          pct: true,
          sq: true,
          format: "percent",
        },
      ],
    };
  };
  const learned = (d: Date) =>
    random("w" + dateKey(d)) < 0.72
      ? Math.floor(1 + random("v" + dateKey(d)) * 9)
      : 0;
  const wordSum = (a: number, b: number) => {
    let total = 0;
    for (let i = a; i >= b; i--) total += learned(ago(i));
    return total;
  };
  const vocabulary = (period: LinePeriod): ChartData => {
    const labels: string[] = [],
      full: string[] = [],
      values: number[] = [];
    if (period === "Days")
      for (let i = 6; i >= 0; i--) {
        const d = ago(i);
        labels.push(WEEKDAYS[d.getDay()] + " " + d.getDate());
        full.push(LONG_WEEKDAYS[d.getDay()] + ", " + formatDay(d));
        values.push(learned(d));
      }
    else if (period === "Weeks")
      for (let w = 3; w >= 0; w--) {
        const a = ago(w * 7 + 6),
          b = ago(w * 7);
        labels.push(formatDay(a) + "–" + b.getDate());
        full.push("Week of " + formatDay(a) + " to " + formatDay(b));
        values.push(wordSum(w * 7 + 6, w * 7));
      }
    else
      for (let q = 5; q >= 0; q--) {
        const mm = new Date(now.getFullYear(), now.getMonth() - q, 1),
          last =
            q === 0
              ? now.getDate()
              : new Date(mm.getFullYear(), mm.getMonth() + 1, 0).getDate();
        let total = 0;
        for (let d = 1; d <= last; d++)
          total += learned(new Date(mm.getFullYear(), mm.getMonth(), d));
        labels.push(SHORT_MONTHS[mm.getMonth()]);
        full.push(
          MONTHS[mm.getMonth()] +
            " " +
            mm.getFullYear() +
            (q === 0 ? " (so far)" : ""),
        );
        values.push(total);
      }
    return {
      labels,
      full,
      aria: "Words learned over time",
      series: [
        {
          name: "Words learned",
          vals: values,
          color: "var(--c-vocab)",
          area: true,
          format: "words",
        },
      ],
    };
  };
  const caption = (period: Period) => {
    const mon = ago((now.getDay() + 6) % 7);
    return period === "Day"
      ? "Today, " + formatDay(now)
      : period === "Week"
        ? "This week, " +
          formatDay(mon) +
          " – " +
          formatDay(ago(((now.getDay() + 6) % 7) - 6))
        : MONTHS[now.getMonth()] + " " + now.getFullYear();
  };
  const topics = (subject: keyof typeof TOPICS, period: Period) =>
    TOPICS[subject].map(([name, base]) => ({
      name,
      value: Math.max(
        5,
        Math.min(
          98,
          Math.round(
            base +
              (random(name + period) - 0.5) *
                2 *
                { Day: 14, Week: 8, Month: 3 }[period],
          ),
        ),
      ),
    }));
  const start = ago(364);
  start.setDate(start.getDate() - start.getDay());
  const cells: {
      date: Date;
      column: number;
      row: number;
      attempted: number;
      level: number;
    }[] = [],
    months: { column: number; label: string }[] = [];
  let attempted = 0,
    lastMonth = -1,
    columns = 0;
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const column = Math.floor(dayDifference(d, start) / 7),
      row = d.getDay();
    columns = column + 1;
    if (dayDifference(now, d) > 364) continue;
    const n = day(d).att;
    attempted += n;
    if (row === 0 && d.getMonth() !== lastMonth) {
      lastMonth = d.getMonth();
      if (column > 0) months.push({ column, label: SHORT_MONTHS[lastMonth] });
    }
    cells.push({
      date: new Date(d),
      column,
      row,
      attempted: n,
      level: heatLevel(n),
    });
  }
  const attempts = classifyAttempts(
    RAW_ATTEMPTS.map(([o, t, cfg, s]) => {
      const c = CONFIGURATIONS[cfg],
        d = ago(-o);
      return {
        o,
        t,
        cfg,
        s,
        m: c.m,
        n: c.n,
        d,
        k: dateKey(d),
        p: (s / c.m) * 100,
      };
    }),
  );
  return {
    now,
    ago,
    day,
    range,
    all,
    week,
    previousWeek,
    general,
    vocabulary,
    caption,
    topics,
    attempts,
    heatmap: { cells, months, columns, attempted },
    accuracyChange:
      percent(week.cor, week.att)! -
      percent(previousWeek.cor, previousWeek.att)!,
  };
}
export type AnalyticsModel = ReturnType<typeof createAnalytics>;
