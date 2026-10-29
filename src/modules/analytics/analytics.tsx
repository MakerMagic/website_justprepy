"use client";
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Inter } from "next/font/google";
import { useRouter } from "next/navigation";
import { PracticeShell } from "../questions/practice-shell";
import type { QuestionBankData } from "../questions/question-bank.types";
import {
  LineChart,
  MockChart,
  StudyHeatmap,
  TopicBars,
  type TooltipActions,
} from "./analytics-charts";
import {
  createAnalytics,
  percent,
  RANKING,
  type AnalyticsModel,
  type LinePeriod,
  type Period,
  type Subject,
} from "./analytics.logic";
import { AnalyticsPopups } from "./analytics-popups";
import type { AnalyticsPopupKind } from "./analytics-popups.logic";
import "./analytics.css";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-analytics",
});
const subscribeToDay = () => () => {};
const clientDay = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T00:00:00`;
};
const serverDay = () => null;
const PERIODS: Period[] = ["Day", "Week", "Month"];
const GENERAL_PERIODS: Exclude<LinePeriod, "Months">[] = ["Days", "Weeks"];
const VOCAB_PERIODS: LinePeriod[] = ["Days", "Weeks", "Months"];
function Segment<T extends string>({
  id,
  label,
  options,
  value,
  onChange,
}: {
  id: string;
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg" id={id} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
const icons = {
  q: (
    <path
      d="M5 8l3 3 6-6M5 20l3 3 6-6M20 10h18M20 22h18"
      transform="scale(2.2) translate(-2 -2)"
      strokeWidth={2}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
    />
  ),
  a: (
    <>
      <circle
        cx={50}
        cy={50}
        r={40}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
      />
      <circle
        cx={50}
        cy={50}
        r={24}
        fill="none"
        stroke="currentColor"
        strokeWidth={8}
      />
      <circle cx={50} cy={50} r={7} fill="currentColor" />
    </>
  ),
  r: (
    <path
      d="M20 80V50h18v30M41 80V25h18v55M62 80V40h18v40"
      fill="none"
      stroke="currentColor"
      strokeWidth={8}
    />
  ),
  t: (
    <path
      d="M50 8l12 26 28 4-20 20 5 28-25-14-25 14 5-28L10 38l28-4z"
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinejoin="round"
    />
  ),
};
function SummaryCards({
  model,
  onRanking,
}: {
  model: AnalyticsModel;
  onRanking: () => void;
}) {
  const delta = model.accuracyChange;
  const cards = [
    {
      label: "Questions solved",
      value: model.all.sol.toLocaleString("en-US"),
      description: <>+{model.week.sol} in the last 7 days</>,
      icon: "q" as const,
    },
    {
      label: "Accuracy",
      value: percent(model.all.cor, model.all.att) + "%",
      description: (
        <>
          <span className={delta >= 0 ? "up" : "dn"}>
            {delta >= 0 ? "▲ +" : "▼ "}
            {delta} pts
          </span>{" "}
          vs previous 7 days
        </>
      ),
      icon: "a" as const,
    },
    {
      label: "Ranking",
      value: "#" + RANKING.rank,
      description: <>of {RANKING.total.toLocaleString("en-US")} students</>,
      icon: "r" as const,
    },
    {
      label: "Title",
      value: RANKING.title,
      description: <>Your current achievement</>,
      icon: "t" as const,
    },
  ];
  return (
    <div className="cards" id="cards">
      {cards.map((card) => (
        <div
          className={"card" + (card.icon === "t" ? " t" : "")}
          key={card.label}
        >
          <div className="l">{card.label}</div>
          <div className="v">{card.value}</div>
          <div className="d">{card.description}</div>
          {card.icon === "r" && (
            <button className="vs" type="button" onClick={onRanking}>
              View more
            </button>
          )}
          <svg className="w" viewBox="0 0 100 100" aria-hidden="true">
            {icons[card.icon]}
          </svg>
        </div>
      ))}
    </div>
  );
}
type TooltipState = {
  content: ReactNode;
  x: number;
  y: number;
  visible: boolean;
};
export function Analytics({
  profile,
  telegramUrl,
}: {
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
}) {
  const date = useSyncExternalStore(subscribeToDay, clientDay, serverDay);
  const model = useMemo(
    () => (date ? createAnalytics(new Date(date)) : null),
    [date],
  );
  const [popups, setPopups] = useState<{
    active: AnalyticsPopupKind | null;
    visited: AnalyticsPopupKind[];
    revision: number;
  }>({ active: null, visited: [], revision: 0 });
  const openPopup = (kind: AnalyticsPopupKind) => {
    setPopups((current) => ({
      active: kind,
      visited: current.visited.includes(kind)
        ? current.visited
        : [...current.visited, kind],
      revision: current.revision + 1,
    }));
    hide();
  };
  const [generalPeriod, setGeneralPeriod] =
    useState<Exclude<LinePeriod, "Months">>("Days");
  const [subject, setSubject] = useState<Subject>("Critical Thinking");
  const [topicPeriod, setTopicPeriod] = useState<Period>("Week"),
    [mathPeriod, setMathPeriod] = useState<Period>("Week");
  const [vocabPeriod, setVocabPeriod] = useState<LinePeriod>("Days");
  const [tip, setTip] = useState<TooltipState | null>(null),
    tipRef = useRef<HTMLDivElement>(null),
    router = useRouter();
  const hide = () =>
    setTip((previous) =>
      previous?.visible ? { ...previous, visible: false } : previous,
    );
  const tooltip: TooltipActions = {
    show: (content, x, y) => setTip({ content, x, y, visible: true }),
    hide,
  };
  useLayoutEffect(() => {
    const el = tipRef.current;
    if (!el || !tip?.visible) return;
    const w = el.offsetWidth,
      t = el.offsetHeight;
    el.style.left =
      Math.min(Math.max(8, tip.x - w / 2), innerWidth - w - 8) + "px";
    el.style.top = (tip.y - t - 14 < 8 ? tip.y + 18 : tip.y - t - 14) + "px";
  }, [tip]);
  const view = (path: string) => router.push(path);
  return (
    <PracticeShell
      profile={profile}
      telegramUrl={telegramUrl}
      skipLabel="Skip to analytics"
    >
      <main
        id="main-content"
        tabIndex={-1}
        className={"analytics-page " + inter.variable}
        onPointerMove={(event) => {
          if (
            !(event.target instanceof Element) ||
            !event.target.closest("[data-analytics-tip],.lc")
          )
            hide();
        }}
        onPointerDown={(event) => {
          if (
            !(event.target instanceof Element) ||
            !event.target.closest("[data-analytics-tip],.lc")
          )
            hide();
        }}
        onPointerLeave={hide}
        onBlurCapture={hide}
      >
        <div className="pg">
          <header>
            <h1>Analytics</h1>
            <p className="note" id="analytics-demo-note">
              Illustrative data. Replace with real student activity.
            </p>
          </header>
          {model && (
            <>
              <section aria-labelledby="h-gen">
                <div className="sh">
                  <h2 id="h-gen">General Analytics</h2>
                </div>
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="ph">
                    <div>
                      <h3>Performance</h3>
                      <div className="lg">
                        <span>
                          <i
                            className="sw"
                            style={{ background: "var(--c-solved)" }}
                          />
                          Questions solved (count, left axis)
                        </span>
                        <span>
                          <i
                            className="sw"
                            style={{
                              background: "var(--c-acc)",
                              borderRadius: 2,
                            }}
                          />
                          Accuracy (%, right axis)
                        </span>
                      </div>
                    </div>
                    <Segment
                      id="s-gen"
                      label="Period"
                      options={GENERAL_PERIODS}
                      value={generalPeriod}
                      onChange={setGeneralPeriod}
                    />
                  </div>
                  <div id="c-gen">
                    <LineChart
                      key={generalPeriod}
                      data={model.general(generalPeriod)}
                      tooltip={tooltip}
                    />
                  </div>
                </div>
                <SummaryCards
                  model={model}
                  onRanking={() => view("/leaderboard")}
                />
                <div className="panel">
                  <div className="ph">
                    <div>
                      <h3>Study activity</h3>
                      <p className="sub">
                        {model.heatmap.attempted.toLocaleString("en-US")}{" "}
                        questions attempted in the last year
                      </p>
                    </div>
                  </div>
                  <StudyHeatmap model={model} tooltip={tooltip} />
                  <div className="hlg">
                    {["None", "Low (1–12)", "Medium (13–35)", "High (36+)"].map(
                      (label, i) => (
                        <span
                          key={label}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            marginRight: 14,
                          }}
                        >
                          <i style={{ background: `var(--h${i})` }} />
                          {label}
                        </span>
                      ),
                    )}
                  </div>
                  <p className="cap" style={{ margin: "8px 0 0" }}>
                    Attempted means an answer option was selected.
                  </p>
                </div>
              </section>
              <section aria-labelledby="h-qb">
                <div className="sh">
                  <div>
                    <h2 id="h-qb">Question Bank Analytics</h2>
                    <p className="sub">
                      Accuracy by topic across Question Bank practice and Mock
                      Tests.
                    </p>
                  </div>
                  <button
                    className="vm"
                    type="button"
                    onClick={() => openPopup("qb")}
                  >
                    View more
                  </button>
                </div>
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="ph">
                    <div>
                      <h3>Accuracy rate by topic</h3>
                      <p className="cap" style={{ margin: "2px 0 0" }}>
                        {model.caption(topicPeriod)}
                      </p>
                    </div>
                    <div className="segs">
                      <Segment
                        id="s-sub"
                        label="Subject"
                        options={["Critical Thinking", "Problem Solving"]}
                        value={subject}
                        onChange={setSubject}
                      />
                      <Segment
                        id="s-p1"
                        label="Period"
                        options={PERIODS}
                        value={topicPeriod}
                        onChange={setTopicPeriod}
                      />
                    </div>
                  </div>
                  <TopicBars
                    model={model}
                    subject={subject}
                    period={topicPeriod}
                    tooltip={tooltip}
                  />
                </div>
                <div className="panel">
                  <div className="ph">
                    <div>
                      <h3>Mathematics</h3>
                      <p className="cap" style={{ margin: "2px 0 0" }}>
                        {model.caption(mathPeriod)}
                      </p>
                    </div>
                    <Segment
                      id="s-p2"
                      label="Period"
                      options={PERIODS}
                      value={mathPeriod}
                      onChange={setMathPeriod}
                    />
                  </div>
                  <TopicBars
                    model={model}
                    subject="Mathematics"
                    period={mathPeriod}
                    tooltip={tooltip}
                  />
                </div>
              </section>
              <section aria-labelledby="h-mt">
                <div className="sh">
                  <div>
                    <h2 id="h-mt">Mock Tests Analytics</h2>
                    <p className="sub">
                      Score range per day. Each result is compared with the
                      previous attempt of the same test configuration; scores
                      are plotted as a percentage of each test’s maximum.
                    </p>
                  </div>
                  <button
                    className="vm"
                    type="button"
                    onClick={() => openPopup("mt")}
                  >
                    View more
                  </button>
                </div>
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="lg" style={{ margin: "0 0 10px" }}>
                    <span>
                      <svg width={14} height={14}>
                        <rect width={14} height={14} rx={3} fill="var(--up)" />
                      </svg>
                      First attempt or improved
                    </span>
                    <span>
                      <svg width={14} height={14}>
                        <rect
                          width={14}
                          height={14}
                          rx={3}
                          fill="var(--down)"
                        />
                      </svg>
                      Declined
                    </span>
                    <span>
                      <svg width={14} height={14}>
                        <rect
                          width={14}
                          height={14}
                          rx={3}
                          fill="var(--same)"
                        />
                      </svg>
                      Same
                    </span>
                    <span>
                      <svg width={12} height={18}>
                        <rect
                          width={12}
                          height={18}
                          rx={6}
                          fill="var(--sunken)"
                          stroke="var(--line2)"
                        />
                      </svg>
                      Range within a day
                    </span>
                  </div>
                  <MockChart model={model} tooltip={tooltip} />
                </div>
              </section>
              <section aria-labelledby="h-vo">
                <div className="sh">
                  <div>
                    <h2 id="h-vo">Vocabulary Analytics</h2>
                    <p className="sub">Words learned, not reviewed or saved.</p>
                  </div>
                  <button
                    className="vm"
                    type="button"
                    onClick={() => openPopup("vo")}
                  >
                    View more
                  </button>
                </div>
                <div className="panel" style={{ marginTop: 0 }}>
                  <div className="ph">
                    <div>
                      <h3>Words learned</h3>
                    </div>
                    <Segment
                      id="s-vo"
                      label="Period"
                      options={VOCAB_PERIODS}
                      value={vocabPeriod}
                      onChange={setVocabPeriod}
                    />
                  </div>
                  <div id="c-vo">
                    <LineChart
                      key={vocabPeriod}
                      data={model.vocabulary(vocabPeriod)}
                      tooltip={tooltip}
                    />
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
        <div
          ref={tipRef}
          className={"analytics-tooltip" + (tip?.visible ? " on" : "")}
          role="status"
        >
          {tip?.content}
        </div>
      </main>
      {date && popups.visited.length > 0 && (
        <AnalyticsPopups
          active={popups.active}
          visited={popups.visited}
          revision={popups.revision}
          reference={date}
          fontClassName={inter.variable}
          onClose={() => setPopups((current) => ({ ...current, active: null }))}
        />
      )}
    </PracticeShell>
  );
}
