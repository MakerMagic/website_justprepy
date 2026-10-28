"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MockTestCard } from "../mock-tests/mock-tests";
import type { MockAction, MockTest } from "../mock-tests/mock-tests.types";
import {
  PracticeDialog,
  PracticeDialogClose,
} from "../questions/practice-dialog";
import type { TooltipActions } from "./analytics-charts";
import { type Period, type LinePeriod, type Subject } from "./analytics.logic";
import {
  PopupBarChart,
  PopupLineChart,
  PopupRadarChart,
  PopupScoreChart,
} from "./analytics-popup-charts";
import {
  createPopupAnalytics,
  formatPopupTime,
  popupTimeByTopic,
  popupLatestMockTests,
  type PopupTimeSubject,
  type PopupTimePeriod,
  POPUP_CONFIGURATIONS,
  POPUP_METRICS,
  popupTopicRows,
  popupErrorRows,
  togglePopupMetric,
  type AnalyticsPopupKind,
  type PopupAnalyticsModel,
  type PopupMetric,
  type PopupConfiguration,
} from "./analytics-popups.logic";
import "./analytics-popups.css";
const PERIODS: Period[] = ["Day", "Week", "Month"],
  PERIOD_MODES: LinePeriod[] = ["Days", "Weeks", "Months"];
const TITLES = {
  qb: "Question Bank Analytics",
  mt: "Mock Tests Analytics",
  vo: "Vocabulary Analytics",
};
const N = (value: number) => value.toLocaleString("en-US");
function Segment<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
function Panel({
  id,
  title,
  caption,
  controls,
  extra,
  legend,
  showLegend = true,
  children,
}: {
  id: string;
  title: string;
  caption?: ReactNode;
  controls?: ReactNode;
  extra?: ReactNode;
  legend?: ReactNode;
  showLegend?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="pn" aria-labelledby={"popup-" + id + "-heading"}>
      <div className="ph">
        <div>
          <h3 id={"popup-" + id + "-heading"}>{title}</h3>
          {caption !== undefined && <p className="cap">{caption}</p>}
          {extra}
        </div>
        {controls && <div className="segs">{controls}</div>}
      </div>
      {children}
      {showLegend && <div className="lg">{legend}</div>}
    </section>
  );
}
function Stat({
  label,
  value,
  description,
  color,
  featured = false,
}: {
  label: string;
  value: ReactNode;
  description: ReactNode;
  color?: string;
  featured?: boolean;
}) {
  return (
    <div className={"sc" + (featured ? " f" : "")}>
      <div className="l">
        {color && <i className="dot" style={{ background: color }} />}
        {label}
      </div>
      <div className="v">{value}</div>
      <div className="d">{description}</div>
    </div>
  );
}
function AccuracyLegend() {
  return (
    <>
      <span>
        <i className="dot" style={{ background: "var(--ok)" }} />
        75% and above
      </span>
      <span>
        <i className="dot" style={{ background: "var(--mid)" }} />
        60–74%
      </span>
      <span>
        <i className="dot" style={{ background: "var(--bad)" }} />
        Below 60%
      </span>
    </>
  );
}
function AccuracyPanel({
  id,
  title,
  subject,
  period,
  onPeriod,
  onSubject,
  model,
  tooltip,
  redraw,
}: {
  id: string;
  title: string;
  subject: Subject | "Mathematics";
  period: Period;
  onPeriod: (value: Period) => void;
  onSubject?: (value: Subject) => void;
  model: PopupAnalyticsModel;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const rows = popupTopicRows(subject, period),
    caption = model.caption(period);
  return (
    <Panel
      id={id}
      title={title}
      caption={caption}
      controls={
        <>
          {onSubject && (
            <Segment
              label="Accuracy subject"
              options={["Critical Thinking", "Problem Solving"]}
              value={subject as Subject}
              onChange={(value) => {
                tooltip.hide();
                onSubject(value);
              }}
            />
          )}
          <Segment
            label={title + " period"}
            options={PERIODS}
            value={period}
            onChange={(value) => {
              tooltip.hide();
              onPeriod(value);
            }}
          />
        </>
      }
      legend={<AccuracyLegend />}
    >
      <PopupBarChart
        labels={rows.map((row) => row.name)}
        full={rows.map((row) => row.name)}
        series={[{ name: "Accuracy", vals: rows.map((row) => row.value) }]}
        maximum={100}
        unit="%"
        ytitle="Accuracy (%)"
        wrap
        slot={84}
        aria="Accuracy by topic"
        tooltip={tooltip}
        redraw={redraw}
        colorFor={(value) =>
          value >= 75 ? "var(--ok)" : value >= 60 ? "var(--mid)" : "var(--bad)"
        }
        content={(i, _series, value) => (
          <>
            <b>
              {rows[i].name} — {value}% accuracy
            </b>
            <br />
            {caption}
          </>
        )}
      />
    </Panel>
  );
}
function QuestionBankPopup({
  model,
  tooltip,
  redraw,
}: {
  model: PopupAnalyticsModel;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const [period, setPeriod] = useState<LinePeriod>("Days"),
    [selected, setSelected] = useState<PopupMetric[]>([
      "att",
      "cor",
      "par",
      "wrg",
    ]),
    [subject, setSubject] = useState<Subject>("Critical Thinking"),
    [topicPeriod, setTopicPeriod] = useState<Period>("Week"),
    [mathPeriod, setMathPeriod] = useState<Period>("Week");
  const totals = model.totals,
    buckets = model.buckets(period);
  const series = POPUP_METRICS.filter((metric) =>
    selected.includes(metric.field),
  ).map((metric) => ({
    name: metric.name,
    color: metric.color,
    vals: buckets.map((bucket) => model.sum(bucket.dates, metric.field)),
  }));
  return (
    <>
      <div className="g4">
        <Stat
          label="Attempted Questions"
          value={N(totals.att)}
          description="Answer option selected"
          color="var(--blue)"
        />
        <Stat
          label="Correct"
          value={N(totals.cor)}
          description={
            Math.round((totals.cor / totals.att) * 100) + "% of attempted"
          }
          color="var(--ok)"
        />
        <Stat
          label="Partly Correct"
          value={N(totals.par)}
          description={
            Math.round((totals.par / totals.att) * 100) + "% of attempted"
          }
          color="var(--mid)"
        />
        <Stat
          label="Wrong"
          value={N(totals.wrg)}
          description={
            Math.round((totals.wrg / totals.att) * 100) + "% of attempted"
          }
          color="var(--bad)"
        />
      </div>
      <Panel
        id="qp"
        title="Question performance"
        caption="Each question is counted once, in exactly one outcome."
        controls={
          <Segment
            label="Question performance period"
            options={PERIOD_MODES}
            value={period}
            onChange={(value) => {
              tooltip.hide();
              setPeriod(value);
            }}
          />
        }
        extra={
          <div
            className="chips"
            role="group"
            aria-label="Question performance metrics"
            style={{ margin: "10px 0 0" }}
          >
            {POPUP_METRICS.map((metric) => (
              <button
                key={metric.field}
                type="button"
                aria-pressed={selected.includes(metric.field)}
                onClick={() => {
                  tooltip.hide();
                  setSelected((current) =>
                    togglePopupMetric(current, metric.field),
                  );
                }}
              >
                <i className="dot" style={{ background: metric.color }} />
                {metric.name}
              </button>
            ))}
          </div>
        }
      >
        <PopupBarChart
          labels={buckets.map((bucket) => bucket.label)}
          full={buckets.map((bucket) => bucket.full)}
          series={series}
          ytitle="Questions"
          aria="Question outcomes over time"
          slot={period === "Days" ? 64 : 84}
          tooltip={tooltip}
          redraw={redraw}
          content={(i, item, value) => (
            <>
              <b>{buckets[i].full}</b>
              <br />
              {item.name}: <b>{value} questions</b>
            </>
          )}
        />
      </Panel>
      <AccuracyPanel
        id="qa"
        title="Accuracy by topic"
        subject={subject}
        onSubject={setSubject}
        period={topicPeriod}
        onPeriod={setTopicPeriod}
        model={model}
        tooltip={tooltip}
        redraw={redraw}
      />
      <AccuracyPanel
        id="qm"
        title="Mathematics accuracy"
        subject="Mathematics"
        period={mathPeriod}
        onPeriod={setMathPeriod}
        model={model}
        tooltip={tooltip}
        redraw={redraw}
      />
    </>
  );
}
function MistakesPanel({
  id,
  title,
  subject,
  onSubject,
  tooltip,
  redraw,
}: {
  id: string;
  title: string;
  subject: Subject | "Mathematics";
  onSubject?: (subject: Subject) => void;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const rows = popupErrorRows(subject),
    weakest = rows.reduce((a, b) => (b.value > a.value ? b : a));
  return (
    <Panel
      id={id}
      title={title}
      caption={
        "Weakest: " +
        weakest.name +
        " (" +
        weakest.value +
        "% error rate). Error rate = wrong answers ÷ attempted questions; further from the centre = more mistakes."
      }
      controls={
        onSubject && (
          <Segment
            label="Mistakes subject"
            options={["Critical Thinking", "Problem Solving"]}
            value={subject as Subject}
            onChange={(value) => {
              tooltip.hide();
              onSubject(value);
            }}
          />
        )
      }
    >
      <PopupRadarChart
        rows={rows}
        aria={
          subject === "Mathematics"
            ? "Mathematics error rate by topic"
            : "Error rate by topic"
        }
        tooltip={tooltip}
        redraw={redraw}
      />
    </Panel>
  );
}
function AverageTimePanel({
  tooltip,
  redraw,
}: {
  tooltip: TooltipActions;
  redraw: number;
}) {
  const [subject, setSubject] = useState<PopupTimeSubject>("Critical Thinking");
  const [period, setPeriod] = useState<PopupTimePeriod>("Last Week");
  const chart = popupTimeByTopic(subject, period);
  return (
    <Panel
      id="tm"
      title="Average time per question"
      caption={
        period +
        " · subject average " +
        formatPopupTime(chart.average) +
        " per question · Illustrative data."
      }
      controls={
        <>
          <Segment
            label="Average time subject"
            options={
              ["Critical Thinking", "Problem Solving", "Mathematics"] as const
            }
            value={subject}
            onChange={(value) => {
              tooltip.hide();
              setSubject(value);
            }}
          />
          <Segment
            label="Average time period"
            options={["Last Week", "Last Month"] as const}
            value={period}
            onChange={(value) => {
              tooltip.hide();
              setPeriod(value);
            }}
          />
        </>
      }
      legend={
        <>
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
        </>
      }
    >
      <PopupTimeChart
        key={subject + period + redraw}
        chart={chart}
        period={period}
        tooltip={tooltip}
      />
    </Panel>
  );
}
function PopupTimeChart({
  chart,
  period,
  tooltip,
}: {
  chart: ReturnType<typeof popupTimeByTopic>;
  period: PopupTimePeriod;
  tooltip: TooltipActions;
}) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let secondFrame: number | undefined;
    // Preserve the source's two-frame start and 550ms stem/dot transitions.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        element.current
          ?.querySelectorAll<HTMLElement>(".st,.dt")
          .forEach((item) => {
            item.style[item.classList.contains("st") ? "width" : "left"] =
              item.dataset.position + "%";
          });
      });
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
    };
  }, []);
  const percentage = (value: number) => (value / chart.maximum) * 100;
  return (
    <div
      className="time-chart"
      ref={element}
      role="group"
      aria-label="Average time per question by topic"
    >
      <div className="tr ta" aria-hidden="true">
        <span className="tn" />
        <div className="tk">
          <span>0s</span>
          <span>{formatPopupTime(chart.maximum / 2)}</span>
          <span>{formatPopupTime(chart.maximum)}</span>
        </div>
        <span />
      </div>
      {chart.rows.map((row) => {
        const content = (
          <>
            <b>{row.name}</b>
            <br />
            {period}
            <br />
            Average: <b>{formatPopupTime(row.seconds)}</b> per question
          </>
        );
        return (
          <div
            className="tr"
            key={row.name}
            tabIndex={0}
            aria-label={
              row.name +
              ", " +
              period +
              ", average " +
              formatPopupTime(row.seconds) +
              " per question"
            }
            onPointerMove={(event) =>
              tooltip.show(content, event.clientX, event.clientY)
            }
            onPointerDown={(event) =>
              tooltip.show(content, event.clientX, event.clientY)
            }
            onPointerLeave={tooltip.hide}
            onFocus={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              tooltip.show(content, rect.x + rect.width / 2, rect.y);
            }}
            onBlur={tooltip.hide}
          >
            <span className="tn">{row.name}</span>
            <div className="pl" aria-hidden="true">
              <i
                className="av"
                style={{ left: percentage(chart.average) + "%" }}
              />
              <i className="st" data-position={percentage(row.seconds)} />
              <i className="dt" data-position={percentage(row.seconds)} />
            </div>
            <b className="tv">{formatPopupTime(row.seconds)}</b>
          </div>
        );
      })}
    </div>
  );
}
function MockTestsPopup({
  model,
  tooltip,
  redraw,
  onAction,
}: {
  model: PopupAnalyticsModel;
  tooltip: TooltipActions;
  redraw: number;
  onAction: (test: MockTest, action: MockAction) => void;
}) {
  const [configuration, setConfiguration] =
      useState<PopupConfiguration>("full"),
    [subject, setSubject] = useState<Subject>("Critical Thinking");
  const labels = Object.values(POPUP_CONFIGURATIONS).map(
      (configuration) => configuration.n,
    ),
    configurationLabel = POPUP_CONFIGURATIONS[configuration].n;
  return (
    <>
      <Panel
        id="sc"
        title="Score progression"
        caption="Each result is compared with the previous attempt of the same configuration."
        controls={
          <Segment
            label="Mock test configuration"
            options={labels}
            value={configurationLabel}
            onChange={(label) => {
              tooltip.hide();
              setConfiguration(
                (
                  Object.keys(POPUP_CONFIGURATIONS) as PopupConfiguration[]
                ).find((key) => POPUP_CONFIGURATIONS[key].n === label)!,
              );
            }}
          />
        }
        legend={
          <>
            <span>
              <i
                className="dot"
                style={{ background: "var(--ok)", borderRadius: 3 }}
              />
              First attempt or improved
            </span>
            <span>
              <i
                className="dot"
                style={{ background: "var(--bad)", borderRadius: 3 }}
              />
              Declined
            </span>
            <span>
              <i
                className="dot"
                style={{ background: "var(--same)", borderRadius: 3 }}
              />
              Unchanged
            </span>
            <span>Grey pill: score range within a day</span>
          </>
        }
      >
        <PopupScoreChart
          model={model}
          configuration={configuration}
          tooltip={tooltip}
          redraw={redraw}
        />
      </Panel>
      <div className="two">
        <MistakesPanel
          id="r1"
          title="Mistakes by topic"
          subject={subject}
          onSubject={setSubject}
          tooltip={tooltip}
          redraw={redraw}
        />
        <MistakesPanel
          id="r2"
          title="Mathematics mistakes"
          subject="Mathematics"
          tooltip={tooltip}
          redraw={redraw}
        />
      </div>
      <AverageTimePanel tooltip={tooltip} redraw={redraw} />
      <Panel id="lt" title="Latest three Mock Tests" showLegend={false}>
        <div className="g3 latest-mock-tests">
          {popupLatestMockTests(model).map((test) => (
            <MockTestCard key={test.id} test={test} onAction={onAction} />
          ))}
        </div>
      </Panel>
    </>
  );
}
function VocabularyPopup({
  model,
  tooltip,
  redraw,
}: {
  model: PopupAnalyticsModel;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const [learnedPeriod, setLearnedPeriod] = useState<LinePeriod>("Days"),
    [flippedPeriod, setFlippedPeriod] = useState<LinePeriod>("Days"),
    [retentionPeriod, setRetentionPeriod] = useState<LinePeriod>("Days");
  const learned = model.buckets(learnedPeriod),
    flipped = model.buckets(flippedPeriod),
    retention = model.buckets(retentionPeriod);
  const controls = (
    label: string,
    value: LinePeriod,
    set: (value: LinePeriod) => void,
  ) => (
    <Segment
      label={label + " period"}
      options={PERIOD_MODES}
      value={value}
      onChange={(period) => {
        tooltip.hide();
        set(period);
      }}
    />
  );
  return (
    <>
      <div className="g4">
        <Stat
          label="Words Learned"
          value={N(model.totals.lrn)}
          description="Newly learned words"
        />
        <Stat
          label="Cards Flipped"
          value={N(model.totals.flp)}
          description="Flips to reveal a meaning"
        />
        <Stat
          label="Retention Rate"
          value={model.retention(model.allDates) + "%"}
          description="Recalled on review after 7+ days"
        />
        <Stat
          label="Favourite Preset"
          value="My Words"
          description="Most used preset"
          featured
        />
      </div>
      <Panel
        id="vl"
        title="Words learned"
        caption="New words learned per period"
        controls={controls("Words learned", learnedPeriod, setLearnedPeriod)}
      >
        <PopupLineChart
          key={learnedPeriod + redraw}
          labels={learned.map((bucket) => bucket.label)}
          full={learned.map((bucket) => bucket.full)}
          values={learned.map((bucket) => model.sum(bucket.dates, "lrn"))}
          color="var(--gdk)"
          area
          bounded
          name="Words learned"
          aria="Words learned over time"
          format={(value) => value + " words"}
          tooltip={tooltip}
          redraw={redraw}
        />
      </Panel>
      <Panel
        id="vf"
        title="Cards flipped"
        caption="Flashcard flips per period"
        controls={controls("Cards flipped", flippedPeriod, setFlippedPeriod)}
      >
        <PopupBarChart
          labels={flipped.map((bucket) => bucket.label)}
          full={flipped.map((bucket) => bucket.full)}
          series={[
            {
              name: "Cards flipped",
              color: "var(--accent)",
              vals: flipped.map((bucket) => model.sum(bucket.dates, "flp")),
            },
          ]}
          ytitle="Flips"
          aria="Cards flipped over time"
          slot={flippedPeriod === "Days" ? 60 : 84}
          tooltip={tooltip}
          redraw={redraw}
          content={(i, _series, value) => (
            <>
              <b>{flipped[i].full}</b>
              <br />
              Cards flipped: <b>{value}</b>
            </>
          )}
        />
      </Panel>
      <Panel
        id="vr"
        title="Retention rate"
        caption="Share of reviewed words recalled after 7+ days"
        controls={controls(
          "Retention rate",
          retentionPeriod,
          setRetentionPeriod,
        )}
      >
        <PopupLineChart
          key={retentionPeriod + redraw}
          labels={retention.map((bucket) => bucket.label)}
          full={retention.map((bucket) => bucket.full)}
          values={retention.map((bucket) => model.retention(bucket.dates))}
          color="var(--teal)"
          name="Retention rate"
          maximum={100}
          unit="%"
          aria="Retention rate over time"
          format={(value) => (value === null ? "no data" : value + "%")}
          tooltip={tooltip}
          redraw={redraw}
        />
      </Panel>
    </>
  );
}
type TipState = { content: ReactNode; x: number; y: number; visible: boolean };
function AnalyticsPopup({
  kind,
  open,
  redraw,
  model,
  fontClassName,
  onClose,
}: {
  kind: AnalyticsPopupKind;
  open: boolean;
  redraw: number;
  model: PopupAnalyticsModel;
  fontClassName: string;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    tipElement = useRef<HTMLDivElement>(null),
    session = useRef<{ previous: HTMLElement | null; overflow: string } | null>(
      null,
    );
  const [tip, setTip] = useState<TipState | null>(null);
  const [actionPreview, setActionPreview] = useState<{
    test: MockTest;
    action: MockAction;
  } | null>(null);
  const hide = useCallback(
    () =>
      setTip((current) =>
        current?.visible ? { ...current, visible: false } : current,
      ),
    [],
  );
  const tooltip = useMemo<TooltipActions>(
    () => ({
      show: (content, x, y) => setTip({ content, x, y, visible: true }),
      hide,
    }),
    [hide],
  );
  const requestClose = () => {
    hide();
    onClose();
  };
  useLayoutEffect(() => {
    const element = tipElement.current;
    if (!element || !tip?.visible) return;
    const w = element.offsetWidth,
      h = element.offsetHeight;
    element.style.left =
      Math.min(Math.max(8, tip.x - w / 2), innerWidth - w - 8) + "px";
    element.style.top =
      (tip.y - h - 14 < 8 ? tip.y + 18 : tip.y - h - 14) + "px";
  }, [tip]);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    let timer: ReturnType<typeof setTimeout> | undefined,
      frame: number | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      if (!element.open) {
        session.current = {
          previous:
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null,
          overflow: document.body.style.overflow,
        };
        element.showModal();
        document.body.style.overflow = "hidden";
        element.dataset.visible = "false";
        element.getBoundingClientRect();
      }
      frame = requestAnimationFrame(() => {
        element.dataset.visible = "true";
        element
          .querySelector<HTMLButtonElement>(".x")
          ?.focus({ preventScroll: true });
      });
    } else if (element.open) {
      element.dataset.visible = "false";
      const finish = () => {
        if (element.open) element.close();
        const previous = session.current;
        session.current = null;
        if (previous) {
          document.body.style.overflow = previous.overflow;
          if (previous.previous?.isConnected)
            previous.previous.focus({ preventScroll: true });
        }
      };
      timer = setTimeout(finish, reduced ? 0 : 220);
    }
    return () => {
      clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, [open]);
  useEffect(() => {
    const element = dialog.current;
    return () => {
      const previous = session.current;
      session.current = null;
      if (element?.open) element.close();
      if (previous) {
        document.body.style.overflow = previous.overflow;
        if (previous.previous?.isConnected)
          previous.previous.focus({ preventScroll: true });
      }
    };
  }, []);
  return (
    <>
      <dialog
        ref={dialog}
        className={"analytics-popup-layer " + fontClassName}
        data-visible="false"
        data-popup={kind}
        aria-labelledby={"popup-title-" + kind}
        aria-describedby="analytics-demo-note"
        onCancel={(event) => {
          event.preventDefault();
          requestClose();
        }}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) requestClose();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          if (!open) {
            event.preventDefault();
            return;
          }
          const controls = Array.from(
              event.currentTarget.querySelectorAll<HTMLElement>(
                "button:not(:disabled),[tabindex='0']",
              ),
            ).filter((element) => element.getClientRects().length > 0),
            first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        onPointerMove={(event) => {
          if (
            !(event.target instanceof Element) ||
            !event.target.closest(".bar,.mk,.vt,.lc,.time-chart .tr[tabindex]")
          )
            hide();
        }}
        onPointerLeave={hide}
      >
        <div className="dlg" inert={!open}>
          <div className="dh">
            <h2 id={"popup-title-" + kind}>{TITLES[kind]}</h2>
            <button
              className="x"
              type="button"
              aria-label="Close"
              onClick={requestClose}
            >
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="mb">
            {kind === "qb" ? (
              <QuestionBankPopup
                model={model}
                tooltip={tooltip}
                redraw={redraw}
              />
            ) : kind === "mt" ? (
              <MockTestsPopup
                model={model}
                tooltip={tooltip}
                redraw={redraw}
                onAction={(test, action) => {
                  hide();
                  setActionPreview({ test, action });
                }}
              />
            ) : (
              <VocabularyPopup
                model={model}
                tooltip={tooltip}
                redraw={redraw}
              />
            )}
          </div>
        </div>
        <div
          ref={tipElement}
          className={"popup-tip" + (tip?.visible ? " on" : "")}
          role="status"
        >
          {tip?.content}
        </div>
      </dialog>
      {kind === "mt" && (
        <PracticeDialog
          open={actionPreview !== null}
          onClose={() => setActionPreview(null)}
          titleId="analytics-mock-preview-title"
          className="topic-dialog mock-preview"
        >
          <div className="popover-heading">
            <h2 id="analytics-mock-preview-title">
              {actionPreview
                ? (actionPreview.action === "analyze" ? "Analyze" : "Retake") +
                  " · " +
                  actionPreview.test.title
                : ""}
            </h2>
            <PracticeDialogClose onClose={() => setActionPreview(null)} />
          </div>
          <p className="preview-note">
            {actionPreview?.action === "analyze" ? "Analyze" : "Retake"} is not
            available in this frontend preview. Your test progress has not
            changed.
          </p>
          <button
            type="button"
            className="button primary"
            onClick={() => setActionPreview(null)}
          >
            Back to Mock Tests
          </button>
        </PracticeDialog>
      )}
    </>
  );
}
export function AnalyticsPopups({
  active,
  visited,
  revision,
  reference,
  fontClassName,
  onClose,
}: {
  active: AnalyticsPopupKind | null;
  visited: AnalyticsPopupKind[];
  revision: number;
  reference: string;
  fontClassName: string;
  onClose: () => void;
}) {
  const model = useMemo(
    () => createPopupAnalytics(new Date(reference)),
    [reference],
  );
  const [resizeRevision, setResizeRevision] = useState(0);
  useEffect(() => {
    if (active === null) return;
    const redraw = () => setResizeRevision((current) => current + 1);
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [active]);
  return (
    <>
      {visited.map((kind) => (
        <AnalyticsPopup
          key={kind}
          kind={kind}
          open={active === kind}
          redraw={revision + resizeRevision}
          model={model}
          fontClassName={fontClassName}
          onClose={onClose}
        />
      ))}
    </>
  );
}
