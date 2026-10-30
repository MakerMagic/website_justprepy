"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { PracticeDialog } from "../questions/practice-dialog";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  demoAttemptResult,
  type DemoMockAttempt,
} from "./mock-test-attempt.logic";
import {
  demoAttemptEvent,
  readCompletedAttemptHistory,
} from "./mock-test-attempt.storage";
import { mockResultModel } from "./mock-test-results.logic";
import type { MockTest } from "./mock-tests.types";
import {
  ANALYTICS_SUBJECTS,
  averageQuestionTimes,
  comparisonTone,
  configurationName,
  formatQuestionTime,
  includedSubjects,
  previousComparable,
  roundAnalytics,
  sectionComparisons,
  topicComparison,
  type AnalyticsSubject,
  type AnalyticsPeriod,
  type AttemptHistoryEntry,
} from "./mock-test-analytics.logic";
import "./mock-test-analytics.css";
const number = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const signed = (n: number) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + number(Math.abs(n));
const date = (n: number) =>
  new Date(n).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
interface TooltipValue {
  content: ReactNode;
  x: number;
  y: number;
}
type ShowTooltip = (value: TooltipValue | null) => void;
function HoverRow({
  className,
  tip,
  show,
  children,
}: {
  className: string;
  tip: ReactNode;
  show: ShowTooltip;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      tabIndex={0}
      onPointerMove={(e) => show({ content: tip, x: e.clientX, y: e.clientY })}
      onPointerDown={(e) => show({ content: tip, x: e.clientX, y: e.clientY })}
      onPointerLeave={() => show(null)}
      onFocus={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        show({ content: tip, x: r.left + r.width / 2, y: r.top });
      }}
      onBlur={() => show(null)}
    >
      {children}
    </div>
  );
}
function Tooltip({ value }: { value: TooltipValue | null }) {
  const ref = useRef<HTMLDivElement>(null),
    [position, setPosition] = useState({ left: 8, top: 8 });
  useLayoutEffect(() => {
    if (!value || !ref.current) return;
    const w = ref.current.offsetWidth,
      h = ref.current.offsetHeight;
    setPosition({
      left: Math.min(Math.max(8, value.x - w / 2), window.innerWidth - w - 8),
      top: value.y - h - 14 < 8 ? value.y + 18 : value.y - h - 14,
    });
  }, [value]);
  return (
    <div
      ref={ref}
      className={"advanced-tip" + (value ? " on" : "")}
      role="status"
      style={position}
    >
      {value?.content}
    </div>
  );
}
function Animate({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);
  return (
    <div className={className} data-grown={grown}>
      {children}
    </div>
  );
}
function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled = [],
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: readonly T[];
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          type="button"
          key={option}
          aria-pressed={option === value}
          disabled={disabled.includes(option)}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
function Chip({ delta }: { delta: number | null }) {
  return (
    <span className={"chip " + comparisonTone(delta)}>
      {delta === null
        ? "No comparable data"
        : delta === 0
          ? "= 0 pp"
          : (delta > 0 ? "▲ " : "▼ ") + signed(delta) + " pp"}
    </span>
  );
}
function Legend() {
  return (
    <div className="lg">
      <span>
        <i className="lk" />
        Previous
      </span>
      <span>
        <i className="lc" />
        Current
      </span>
      <span>
        <i className="lb" style={{ background: "var(--up)" }} />
        Improved
      </span>
      <span>
        <i className="lb" style={{ background: "var(--down)" }} />
        Declined
      </span>
      <span>
        <i className="lb" style={{ background: "var(--same)" }} />
        Unchanged
      </span>
    </div>
  );
}
function Scale() {
  return (
    <div className="scale">
      <span>0%</span>
      <span>50%</span>
      <span>100%</span>
    </div>
  );
}
function Range({
  current,
  previous,
  delta,
  base = false,
}: {
  current: number | null;
  previous: number | null;
  delta: number | null;
  base?: boolean;
}) {
  const low = Math.min(current ?? 0, previous ?? current ?? 0),
    high = Math.max(current ?? 0, previous ?? current ?? 0);
  return (
    <div className="pl2">
      <div className="tkr" />
      {base && current !== null && (
        <i className="base" data-w style={{ width: current + "%" }} />
      )}
      {delta !== null && (
        <i
          className="seg2"
          data-w
          data-l
          style={{
            background: "var(--" + comparisonTone(delta) + ")",
            left: low + "%",
            width: Math.max(0.8, high - low) + "%",
          }}
        />
      )}
      {previous !== null && (
        <i className="mp" data-l style={{ left: previous + "%" }} />
      )}
      {current !== null && (
        <i className="mcur" data-l style={{ left: current + "%" }} />
      )}
    </div>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <p className="emp">
      <b>{title}</b>
      {children}
    </p>
  );
}
export function MockTestAnalytics({
  open,
  onClose,
  test,
  attempt,
  fontClass = "",
}: {
  open: boolean;
  onClose: () => void;
  test: MockTest;
  attempt?: DemoMockAttempt;
  fontClass?: string;
}) {
  const [history, setHistory] = useState<AttemptHistoryEntry[]>([]),
    [storageError, setStorageError] = useState("");
  const [timeSubject, setTimeSubject] = useState<AnalyticsSubject>(
    includedSubjects(test)[0],
  );
  const [topicSubject, setTopicSubject] = useState<AnalyticsSubject>(
    includedSubjects(test)[0],
  );
  const [period, setPeriod] = useState<AnalyticsPeriod>("Last Week"),
    [tooltip, setTooltip] = useState<TooltipValue | null>(null);
  useEffect(() => {
    if (!open) return;
    let disposed = false;
    const load = () => {
      if (disposed) return;
      try {
        setHistory(readCompletedAttemptHistory(demoMockTests));
        setStorageError("");
      } catch {
        setStorageError(
          "Attempt history could not be read from this browser. Comparisons and historical timing are unavailable.",
        );
        setHistory([]);
      }
    };
    void Promise.resolve().then(load);
    window.addEventListener("storage", load);
    window.addEventListener(demoAttemptEvent, load);
    return () => {
      disposed = true;
      window.removeEventListener("storage", load);
      window.removeEventListener(demoAttemptEvent, load);
    };
  }, [open]);
  const current = useMemo(
    () => (attempt?.completedAt != null ? { test, attempt } : null),
    [test, attempt],
  );
  const previous = useMemo(
    () => (current ? previousComparable(current, history) : null),
    [current, history],
  );
  const model = mockResultModel(test),
    previousTest = previous
      ? demoAttemptResult(previous.test, previous.attempt)
      : null;
  const timings = averageQuestionTimes(
    current,
    storageError ? [] : history,
    timeSubject,
    period,
  );
  const comparison = sectionComparisons(current, previous),
    topics = topicComparison(current, previous, topicSubject);
  const available = includedSubjects(test),
    disabled = ANALYTICS_SUBJECTS.filter((s) => !available.includes(s));
  const maxTime = timings.rows.length
    ? Math.max(30, Math.ceil((timings.rows[0].seconds * 1.15) / 30) * 30)
    : 30;
  const close = () => {
    setTooltip(null);
    onClose();
  };
  const sourceNote = current
    ? "Browser-local demo attempt · no authenticated account or official scoring service"
    : "Catalogue example · not a saved student attempt";
  return (
    <PracticeDialog
      open={open}
      onClose={close}
      titleId="advanced-mock-title"
      className={"mock-advanced " + fontClass}
      initialFocus=".advanced-close"
    >
      <div className="dlg">
        <header className="dh">
          <div>
            <h2 id="advanced-mock-title">Mock Test Analytics</h2>
            <p>
              {test.title} · Session #{model?.sessionId}
            </p>
          </div>
          <button
            className="x advanced-close"
            type="button"
            aria-label="Close Mock Test Analytics"
            onClick={close}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="mb" onScroll={() => setTooltip(null)}>
          <p className="cap source-note">
            {sourceNote}.{" "}
            {current &&
              !attempt?.analytics &&
              "This older attempt has no saved topic or question-timing observations."}
          </p>
          {storageError && (
            <p role="alert" className="cap">
              {storageError}
            </p>
          )}
          <section className="pn" aria-labelledby="advanced-overall">
            <div className="two">
              <div className="sc">
                <h3 id="advanced-overall" style={{ marginBottom: 14 }}>
                  Overall Result &amp; Answer Distribution
                </h3>
                <div className="l">Scaled score</div>
                <h4>{test.title}</h4>
                <div className="big">
                  {test.result?.score ?? "—"}
                  <small>/ {test.maxScore}</small>
                </div>
                <div className="pc">
                  {test.result?.score != null
                    ? roundAnalytics(
                        (test.result.score / test.maxScore) * 100,
                      ) + "%"
                    : "Unavailable"}
                  <small>
                    {test.result?.score != null
                      ? "of the maximum score"
                      : "Official scoring is not connected"}
                  </small>
                </div>
              </div>
              {model?.counts ? (
                <Animate
                  key={open ? "distribution-open" : "distribution-closed"}
                  className="ob"
                >
                  <div
                    role="group"
                    aria-label={
                      "Answer distribution of " +
                      test.questionCount +
                      " questions"
                    }
                  >
                    {(
                      [
                        ["correct", "Correct", "up"],
                        ["incorrect", "Incorrect", "down"],
                        ["omitted", "Omitted", "same"],
                      ] as const
                    ).map(([key, label, color]) => {
                      const count = model.counts![key],
                        percent = roundAnalytics(
                          (count / test.questionCount) * 100,
                        );
                      return (
                        <HoverRow
                          key={key}
                          className="or"
                          show={setTooltip}
                          tip={
                            <>
                              <b>{label}</b>
                              <br />
                              {count} of {test.questionCount} questions (
                              {percent}%)
                            </>
                          }
                        >
                          <span className="ol">
                            <span
                              className="gl"
                              style={{ background: "var(--" + color + ")" }}
                            >
                              <svg
                                viewBox="0 0 12 12"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path
                                  d={
                                    key === "correct"
                                      ? "M2.5 6.5l2.5 2.5 4.5-5.5"
                                      : key === "incorrect"
                                        ? "M3 3l6 6M9 3l-6 6"
                                        : "M3 6h6"
                                  }
                                />
                              </svg>
                            </span>
                            {label}
                          </span>
                          <div className="ot">
                            <i
                              data-w
                              style={{
                                width: percent + "%",
                                background: "var(--" + color + ")",
                              }}
                            />
                          </div>
                          <span className="ov">
                            <b>{count}</b>
                            <small>{percent}%</small>
                          </span>
                        </HoverRow>
                      );
                    })}
                  </div>
                  <div className="cap" style={{ textAlign: "right" }}>
                    {test.questionCount} questions in total
                  </div>
                </Animate>
              ) : (
                <Empty title="Answer distribution unavailable">
                  This attempt has no complete question results.
                </Empty>
              )}
            </div>
          </section>
          <section className="pn" aria-labelledby="advanced-time">
            <h3 id="advanced-time">Average Time per Question</h3>
            <p className="cap">
              {period}
              {current ? " ending " + date(current.attempt.completedAt!) : ""}
              {timings.average !== null
                ? " · subject average " +
                  formatQuestionTime(timings.average) +
                  " per observed question"
                : ""}
              . Visible question time only; hidden tabs and time away are
              excluded.
            </p>
            <div className="segs">
              <Segment
                label="Timing subject"
                options={ANALYTICS_SUBJECTS}
                value={timeSubject}
                disabled={disabled}
                onChange={(v) => {
                  setTimeSubject(v);
                  setTooltip(null);
                }}
              />
              <Segment
                label="Timing period"
                options={["Last Week", "Last Month"] as const}
                value={period}
                onChange={(v) => {
                  setPeriod(v);
                  setTooltip(null);
                }}
              />
            </div>
            {timings.rows.length ? (
              <Animate key={[open, timeSubject, period].join(":")}>
                <div className="tr ta">
                  <span className="tn" />
                  <div className="tk">
                    <span>0s</span>
                    <span>{formatQuestionTime(maxTime / 2)}</span>
                    <span>{formatQuestionTime(maxTime)}</span>
                  </div>
                  <span />
                </div>
                {timings.rows.map((row) => (
                  <HoverRow
                    key={row.name}
                    className="tr"
                    show={setTooltip}
                    tip={
                      <>
                        <b>{row.name}</b>
                        <br />
                        {period}
                        <br />
                        Average: <b>{formatQuestionTime(row.seconds)}</b> per
                        question
                        <br />
                        {row.samples} observed questions
                      </>
                    }
                  >
                    <span className="tn">{row.name}</span>
                    <div className="pl">
                      <i
                        className="av"
                        style={{
                          left: (timings.average! / maxTime) * 100 + "%",
                        }}
                      />
                      <i
                        className="st"
                        data-w
                        style={{ width: (row.seconds / maxTime) * 100 + "%" }}
                      />
                      <i
                        className="dt"
                        data-l
                        style={{ left: (row.seconds / maxTime) * 100 + "%" }}
                      />
                    </div>
                    <b className="tv">{formatQuestionTime(row.seconds)}</b>
                  </HoverRow>
                ))}
                <div className="lg">
                  <span>
                    <i
                      className="dot"
                      style={{
                        background: "var(--accent)",
                        border: "2px solid var(--gdk)",
                      }}
                    />
                    Average time per question
                  </span>
                  <span>
                    <i className="avk" />
                    Subject average
                  </span>
                </div>
              </Animate>
            ) : (
              <Empty title="No timing data yet">
                There are no observed, topic-matched {timeSubject} questions in
                this period.
              </Empty>
            )}
          </section>
          <section className="pn" aria-labelledby="advanced-previous">
            <h3 id="advanced-previous">
              Comparison with Previous Comparable Mock Test
            </h3>
            {previous && previousTest ? (
              <div className="cmp" style={{ marginTop: 16 }}>
                <div className="mc">
                  <span className="k">Previous Comparable Mock Test</span>
                  <h4>{previous.test.title}</h4>
                  <div className="tags">
                    <span className="tag">
                      {configurationName(previous.test.type)}
                    </span>
                    {includedSubjects(previous.test).map((name) => (
                      <span key={name} className="tag">
                        {name}
                      </span>
                    ))}
                  </div>
                  <div className="sco">
                    {previousTest.result?.score ?? "—"}
                    <small> / {previous.test.maxScore}</small>
                  </div>
                  <div className="mm">
                    Completed {date(previous.attempt.completedAt!)}
                  </div>
                  <div className="mm">Session #{previous.attempt.id}</div>
                </div>
                <div>
                  <Scale />
                  <Animate key={[open, previous.attempt.id].join(":")}>
                    {comparison.map((row) => (
                      <HoverRow
                        key={row.name}
                        className="cr"
                        show={setTooltip}
                        tip={
                          <>
                            <b>{row.name}</b>
                            <br />
                            {row.unit}
                            <br />
                            Current: {row.currentLabel}{" "}
                            {row.current !== null &&
                              "(" + number(row.current) + "%)"}
                            <br />
                            Previous: {row.previousLabel}{" "}
                            {row.previous !== null &&
                              "(" + number(row.previous) + "%)"}
                            <br />
                            <b>
                              {row.delta === null
                                ? "No comparable data"
                                : "Change: " +
                                  signed(row.delta) +
                                  " percentage points"}
                            </b>
                          </>
                        }
                      >
                        <span className="cn">
                          {row.name}
                          <small>
                            {row.unit}
                            <br />
                            {row.previousLabel} → {row.currentLabel}
                          </small>
                        </span>
                        <Range
                          current={row.current}
                          previous={row.previous}
                          delta={row.delta}
                        />
                        <Chip delta={row.delta} />
                      </HoverRow>
                    ))}
                  </Animate>
                  <Legend />
                </div>
              </div>
            ) : (
              <Empty title="No previous comparable Mock Test">
                No earlier completed{" "}
                {configurationName(test.type).toLowerCase()} with a known
                matching profile is available. Only saved attempts with the same
                section configuration are compared.
              </Empty>
            )}
          </section>
          <section className="pn" aria-labelledby="advanced-topics">
            <h3 id="advanced-topics">Topic-Level Performance Comparison</h3>
            <p className="cap">
              Accuracy = correct answers ÷ assigned questions in the topic.{" "}
              {previous
                ? "Compared with " +
                  previous.test.title +
                  " (" +
                  configurationName(previous.test.type) +
                  ")."
                : "No previous comparable Mock Test, so no changes are shown."}{" "}
              Demonstration section slots without matching source subject/topic
              metadata have no topic statistics.
            </p>
            <div className="segs">
              <Segment
                label="Topic comparison subject"
                options={ANALYTICS_SUBJECTS}
                value={topicSubject}
                disabled={disabled}
                onChange={(v) => {
                  setTopicSubject(v);
                  setTooltip(null);
                }}
              />
            </div>
            <Scale />
            <Animate key={[open, topicSubject, previous?.attempt.id].join(":")}>
              {topics.map((row) => (
                <HoverRow
                  key={row.name}
                  className="t4"
                  show={setTooltip}
                  tip={
                    <>
                      <b>{row.name}</b>
                      <br />
                      Current:{" "}
                      {row.current
                        ? row.current.correct +
                          " / " +
                          row.current.total +
                          " correct — " +
                          number(row.current.percent) +
                          "%"
                        : "No topic-matched questions available"}
                      <br />
                      Previous:{" "}
                      {row.previous
                        ? row.previous.correct +
                          " / " +
                          row.previous.total +
                          " correct — " +
                          number(row.previous.percent) +
                          "%"
                        : "No comparable data"}
                      {row.delta !== null && (
                        <>
                          <br />
                          <b>
                            Difference: {signed(row.delta)} percentage points
                          </b>
                        </>
                      )}
                    </>
                  }
                >
                  <span className="tn">{row.name}</span>
                  <Range
                    current={row.current?.percent ?? null}
                    previous={
                      row.current ? (row.previous?.percent ?? null) : null
                    }
                    delta={row.delta}
                    base
                  />
                  {row.current ? (
                    <Chip delta={row.delta} />
                  ) : (
                    <span className="chip none">
                      {attempt?.analytics ? "No questions" : "Unavailable"}
                    </span>
                  )}
                </HoverRow>
              ))}
            </Animate>
            <Legend />
            <p className="cap">pp = percentage points</p>
          </section>
        </div>
      </div>
      <Tooltip value={open ? tooltip : null} />
    </PracticeDialog>
  );
}
