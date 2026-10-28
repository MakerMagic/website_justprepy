// Illustrative data and formulas from the supplied Analytics pop-ups HTML.
import { demoMockTests } from "../mock-tests/mock-tests.fixtures";
import type { MockTest, MockTestType } from "../mock-tests/mock-tests.types";
import {
  MONTHS,
  SHORT_MONTHS,
  WEEKDAYS,
  LONG_WEEKDAYS,
  TOPICS,
  dateKey,
  formatDay,
  hash,
  random,
  classifyAttempts,
  type Period,
  type LinePeriod,
  type Subject,
} from "./analytics.logic";

export type AnalyticsPopupKind = "qb" | "mt" | "vo";
export type PopupMetric = "att" | "cor" | "par" | "wrg";
export type PopupActivity = Record<
  PopupMetric | "lrn" | "flp" | "rev" | "rec",
  number
>;
export type PopupBucket = { label: string; full: string; dates: Date[] };
export const POPUP_CONFIGURATIONS = {
  full: {
    n: "Full Test",
    m: 240,
    q: 120,
    min: 180,
    s: ["Critical Thinking", "Problem Solving", "Mathematics"],
  },
  ctps: {
    n: "Critical Thinking + Problem Solving",
    m: 120,
    q: 60,
    min: 90,
    s: ["Critical Thinking", "Problem Solving"],
  },
  math: { n: "Mathematics", m: 120, q: 60, min: 90, s: ["Mathematics"] },
};
export type PopupConfiguration = keyof typeof POPUP_CONFIGURATIONS;
export const POPUP_RAW_ATTEMPTS: [
  number,
  string,
  PopupConfiguration,
  number,
][] = [
  [-42, "09:00", "full", 58],
  [-35, "10:00", "full", 62],
  [-35, "16:30", "full", 55],
  [-28, "09:30", "full", 81],
  [-21, "09:00", "full", 94],
  [-14, "11:00", "full", 88],
  [-7, "09:00", "full", 104],
  [-7, "15:00", "full", 104],
  [-2, "10:00", "full", 121],
  [-40, "10:00", "ctps", 44],
  [-30, "09:00", "ctps", 51],
  [-30, "17:00", "ctps", 57],
  [-22, "10:30", "ctps", 55],
  [-15, "09:00", "ctps", 63],
  [-9, "09:30", "ctps", 70],
  [-3, "08:30", "ctps", 66],
  [-38, "11:00", "math", 39],
  [-26, "09:00", "math", 48],
  [-19, "09:00", "math", 48],
  [-12, "10:00", "math", 58],
  [-12, "18:00", "math", 62],
  [-6, "09:00", "math", 57],
  [-1, "08:00", "math", 71],
];
export const POPUP_METRICS = [
  { name: "Attempted", field: "att", color: "var(--blue)" },
  { name: "Correct", field: "cor", color: "var(--ok)" },
  { name: "Partly correct", field: "par", color: "var(--mid)" },
  { name: "Wrong", field: "wrg", color: "var(--bad)" },
] as const;
export function togglePopupMetric(
  selected: readonly PopupMetric[],
  field: PopupMetric,
): PopupMetric[] {
  return selected.includes(field)
    ? selected.length === 1
      ? [...selected]
      : selected.filter((item) => item !== field)
    : [...selected, field];
}
export function popupNiceMaximum(maximum: number) {
  const step =
    [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000].find(
      (value) => value >= maximum / 4,
    ) ?? Math.ceil(maximum / 4);
  return step * 4;
}
export function wrapPopupLabel(text: string, maximum = 12) {
  const lines: string[] = [];
  let line = "";
  text.split(" ").forEach((word) => {
    if (line && (line + " " + word).length > maximum) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  });
  lines.push(line);
  return lines;
}
export function popupTopicRows(
  subject: Subject | "Mathematics",
  period: Period,
) {
  const amplitude = { Day: 14, Week: 8, Month: 3 }[period];
  return TOPICS[subject].map(([name, base]) => ({
    name,
    value: Math.max(
      5,
      Math.min(
        98,
        Math.round(base + (random(name + period) - 0.5) * 2 * amplitude),
      ),
    ),
  }));
}
export function popupErrorRows(subject: Subject | "Mathematics") {
  return popupTopicRows(subject, "Month").map((row) => ({
    name: row.name,
    value: 100 - row.value,
    attempted: 40 + Math.floor(random("q" + row.name) * 80),
  }));
}
export function createPopupAnalytics(reference: Date) {
  const now = new Date(reference);
  now.setHours(0, 0, 0, 0);
  const ago = (n: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - n);
    return date;
  };
  const memo = new Map<string, PopupActivity>();
  const day = (date: Date): PopupActivity => {
    const key = dateKey(date),
      cached = memo.get(key);
    if (cached) return cached;
    const back = Math.round((now.getTime() - date.getTime()) / 864e5),
      weekend = date.getDay() % 6 === 0,
      forced = back < 7;
    let att = 0;
    if (forced || random("a" + key) < (weekend ? 0.45 : 0.7))
      att =
        Math.floor(3 + Math.pow(random("n" + key), 1.7) * (weekend ? 55 : 78)) +
        (forced ? 6 : 0);
    const accuracy = Math.min(
      0.97,
      0.68 + 0.2 * random("c" + key) + 0.06 * (1 - Math.min(back, 365) / 365),
    );
    const cor = Math.round(att * accuracy),
      rest = att - cor,
      par = Math.round(rest * (0.35 + 0.2 * random("p" + key)));
    const lrn =
      random("w" + key) < 0.72 || forced
        ? Math.floor(1 + random("v" + key) * 9)
        : 0;
    const flp =
      lrn || random("f" + key) < 0.5
        ? Math.round(12 + random("g" + key) * 70)
        : 0;
    const rev = Math.round(flp * 0.4),
      rec = Math.round(
        rev *
          (0.66 +
            0.22 * random("t" + key) +
            0.05 * (1 - Math.min(back, 365) / 365)),
      );
    const result = { att, cor, par, wrg: rest - par, lrn, flp, rev, rec };
    memo.set(key, result);
    return result;
  };
  const sum = (dates: readonly Date[], field: keyof PopupActivity) =>
    dates.reduce((total, date) => total + day(date)[field], 0);
  const buckets = (period: LinePeriod): PopupBucket[] => {
    const result: PopupBucket[] = [];
    if (period === "Days")
      for (let i = 6; i >= 0; i--) {
        const date = ago(i);
        result.push({
          label: WEEKDAYS[date.getDay()] + " " + date.getDate(),
          full: LONG_WEEKDAYS[date.getDay()] + ", " + formatDay(date),
          dates: [date],
        });
      }
    else if (period === "Weeks")
      for (let week = 3; week >= 0; week--) {
        const dates: Date[] = [];
        for (let i = week * 7 + 6; i >= week * 7; i--) dates.push(ago(i));
        result.push({
          label:
            formatDay(dates[0]) +
            "–" +
            (dates[0].getMonth() === dates[6].getMonth()
              ? dates[6].getDate()
              : formatDay(dates[6])),
          full: "Week of " + formatDay(dates[0]) + " – " + formatDay(dates[6]),
          dates,
        });
      }
    else
      for (let q = 5; q >= 0; q--) {
        const month = new Date(now.getFullYear(), now.getMonth() - q, 1);
        const last = q
          ? new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
          : now.getDate();
        const dates = Array.from(
          { length: last },
          (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1),
        );
        result.push({
          label: SHORT_MONTHS[month.getMonth()],
          full:
            MONTHS[month.getMonth()] +
            " " +
            month.getFullYear() +
            (q ? "" : " (so far)"),
          dates,
        });
      }
    return result;
  };
  const allDates = Array.from({ length: 365 }, (_, i) => ago(i));
  const totals = Object.fromEntries(
    (["att", "cor", "par", "wrg", "lrn", "flp", "rev", "rec"] as const).map(
      (field) => [field, sum(allDates, field)],
    ),
  ) as PopupActivity;
  const retention = (dates: readonly Date[]) => {
    const reviewed = sum(dates, "rev");
    return reviewed ? Math.round((sum(dates, "rec") / reviewed) * 100) : null;
  };
  const caption = (period: Period) =>
    period === "Day"
      ? "Today, " + formatDay(now)
      : period === "Week"
        ? "This week, " +
          formatDay(ago((now.getDay() + 6) % 7)) +
          " – " +
          formatDay(ago(((now.getDay() + 6) % 7) - 6))
        : MONTHS[now.getMonth()] + " " + now.getFullYear();
  const attempts = classifyAttempts(
    POPUP_RAW_ATTEMPTS.map(([o, t, cfg, s]) => {
      const date = ago(-o);
      return {
        o,
        t,
        cfg,
        s,
        m: POPUP_CONFIGURATIONS[cfg].m,
        n: POPUP_CONFIGURATIONS[cfg].n,
        date,
        key: dateKey(date),
      };
    }),
  );
  const latest = attempts
    .slice()
    .sort((a, b) => b.o - a.o || b.t.localeCompare(a.t))
    .slice(0, 3)
    .map((attempt) => ({
      ...attempt,
      difficulty: (["Hard", "Medium", "Easy"] as const)[
        hash(attempt.cfg + attempt.o) % 3
      ],
    }));
  return {
    now,
    ago,
    day,
    sum,
    buckets,
    allDates,
    totals,
    retention,
    caption,
    attempts,
    latest,
  };
}
export type PopupAnalyticsModel = ReturnType<typeof createPopupAnalytics>;

export type PopupTimeSubject = Subject | "Mathematics";
export type PopupTimePeriod = "Last Week" | "Last Month";
const POPUP_TOPIC_SECONDS: Record<PopupTimeSubject, readonly number[]> = {
  "Critical Thinking": [78, 92, 84, 96, 71, 88, 64],
  "Problem Solving": [105, 118, 82],
  Mathematics: [58, 66, 94, 87, 112],
};
export function formatPopupTime(seconds: number) {
  return seconds >= 60
    ? Math.floor(seconds / 60) +
        "m " +
        String(seconds % 60).padStart(2, "0") +
        "s"
    : seconds + "s";
}
/** Supplied illustrative timing values, not recorded student attempt durations. */
export function popupTimeByTopic(
  subject: PopupTimeSubject,
  period: PopupTimePeriod,
) {
  const rows = TOPICS[subject]
    .map(([name], index) => ({
      name,
      seconds: Math.max(
        20,
        Math.round(
          POPUP_TOPIC_SECONDS[subject][index] +
            (random(name + period) - 0.5) *
              2 *
              (period === "Last Week" ? 12 : 4),
        ),
      ),
    }))
    .sort((a, b) => b.seconds - a.seconds);
  return {
    rows,
    average: Math.round(
      rows.reduce((sum, row) => sum + row.seconds, 0) / rows.length,
    ),
    maximum: Math.ceil((rows[0].seconds * 1.15) / 30) * 30,
  };
}
/** Reuse the main catalogue metadata while retaining each Analytics attempt's result. */
export function popupLatestMockTests(model: PopupAnalyticsModel): MockTest[] {
  const types: Record<PopupConfiguration, MockTestType> = {
    full: "full",
    ctps: "crit-ps",
    math: "math",
  };
  return model.latest.map((attempt) => {
    const test = demoMockTests.find(
      (item) => item.type === types[attempt.cfg],
    )!;
    const completedAt = new Date(attempt.date);
    const [hours, minutes] = attempt.t.split(":").map(Number);
    completedAt.setHours(hours, minutes, 0, 0);
    return {
      ...test,
      id:
        "analytics-" +
        test.id +
        "-" +
        attempt.o +
        "-" +
        attempt.t.replace(":", ""),
      subjects: { ...test.subjects },
      maxScore: attempt.m,
      result: { score: attempt.s, completedAt: completedAt.toISOString() },
    };
  });
}
