"use client";
import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  dateKey,
  formatDay,
  MONTHS,
  WEEKDAYS,
  accuracyLevel,
  formatSeriesValue,
  seriesAxes,
  smoothPath,
  monotonePath,
  type AnalyticsModel,
  type ChartData,
  type Period,
} from "./analytics.logic";
export type TooltipActions = {
  show: (content: ReactNode, x: number, y: number) => void;
  hide: () => void;
};
function useChartWidth(minimum: number) {
  const host = useRef<HTMLDivElement>(null);
  const subscribe = useCallback((notify: () => void) => {
    const observer = new ResizeObserver(notify);
    if (host.current) observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const width = useSyncExternalStore(
    subscribe,
    () => Math.max(host.current?.clientWidth ?? minimum, minimum),
    () => minimum,
  );
  return { host, width };
}
export function LineChart({
  data,
  tooltip,
}: {
  data: ChartData;
  tooltip: TooltipActions;
}) {
  const { host, width: W } = useChartWidth(280),
    [active, setActive] = useState<number | null>(null);
  const current = useRef(0);
  const H = 270,
    l = 46,
    r = data.series.length > 1 ? 46 : 14,
    t = 12,
    b = 30,
    iw = W - l - r,
    ih = H - t - b,
    n = data.labels.length;
  const axes = seriesAxes(data.series),
    X = (i: number) => l + 16 + (i * (iw - 32)) / Math.max(1, n - 1);
  const Y = (a: number, v: number) =>
    t + ih - ((v - axes[a].lo) / (axes[a].hi - axes[a].lo)) * ih;
  const tick = (a: number, i: number) =>
    axes[a].lo + ((axes[a].hi - axes[a].lo) * i) / 4;
  const show = (index: number, svg: SVGSVGElement) => {
    const i = Math.max(0, Math.min(n - 1, index));
    current.current = i;
    setActive(i);
    const bounds = svg.getBoundingClientRect();
    tooltip.show(
      <>
        <b>{data.full[i]}</b>
        {data.series.map((series) => (
          <div className="r" key={series.name}>
            <i className="sw" style={{ background: series.color }} />
            {series.name}: <b>{formatSeriesValue(series, series.vals[i])}</b>
          </div>
        ))}
      </>,
      bounds.left + X(i) * (bounds.width / W),
      bounds.top + Y(0, data.series[0].vals[i] ?? 0),
    );
  };
  const hide = () => {
    setActive(null);
    tooltip.hide();
  };
  const at = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect(),
      x = (event.clientX - bounds.left) * (W / bounds.width);
    show(
      Math.round((x - l - 16) / ((iw - 32) / Math.max(1, n - 1))),
      event.currentTarget,
    );
  };
  return (
    <div ref={host}>
      <svg
        className="lc"
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        tabIndex={0}
        role="img"
        aria-label={data.aria}
        onPointerMove={at}
        onPointerDown={at}
        onPointerLeave={hide}
        onBlur={hide}
        onFocus={(event) => show(current.current, event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            show(
              Math.max(
                0,
                Math.min(
                  n - 1,
                  current.current + (event.key === "ArrowRight" ? 1 : -1),
                ),
              ),
              event.currentTarget,
            );
          }
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const y = Y(0, tick(0, i));
          return (
            <Fragment key={i}>
              <line className="gl" x1={l} x2={W - r} y1={y} y2={y} />
              <text
                className="ax"
                x={l - 8}
                y={y + 4}
                textAnchor="end"
                style={{ fill: data.series[0].color }}
              >
                {Math.round(tick(0, i))}
                {data.series[0].pct ? "%" : ""}
              </text>
              {data.series[1] && (
                <text
                  className="ax"
                  x={W - r + 8}
                  y={y + 4}
                  style={{ fill: data.series[1].color }}
                >
                  {Math.round(tick(1, i))}%
                </text>
              )}
            </Fragment>
          );
        })}
        {data.labels.map((label, i) => (
          <text key={i} className="ax" x={X(i)} y={H - 8} textAnchor="middle">
            {label}
          </text>
        ))}
        {data.series.map((series, si) => {
          const points = series.vals.flatMap((value, i) =>
              value === null ? [] : [[X(i), Y(si, value)]],
            ),
            path =
              series.format === "words"
                ? monotonePath(points)
                : smoothPath(points);
          return (
            <Fragment key={series.name}>
              {series.area && points.length > 0 && (
                <path
                  d={`${path}L${points.at(-1)![0]},${t + ih}L${points[0][0]},${t + ih}Z`}
                  fill={series.color}
                  opacity=".14"
                />
              )}
              <path
                d={path}
                fill="none"
                stroke={series.color}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {points.map((point, i) =>
                series.sq ? (
                  <rect
                    key={i}
                    x={point[0] - 4}
                    y={point[1] - 4}
                    width={8}
                    height={8}
                    rx={2}
                    fill="var(--surface)"
                    stroke={series.color}
                    strokeWidth={2}
                  />
                ) : (
                  <circle
                    key={i}
                    cx={point[0]}
                    cy={point[1]}
                    r={4}
                    fill="var(--surface)"
                    stroke={series.color}
                    strokeWidth={2}
                  />
                ),
              )}
            </Fragment>
          );
        })}
        <line
          data-chart-guide="true"
          x1={active === null ? 0 : X(active)}
          x2={active === null ? 0 : X(active)}
          y1={t}
          y2={t + ih}
          stroke="var(--line2)"
          strokeDasharray="3 3"
          opacity={active === null ? 0 : 1}
        />
        {data.series.map((series, si) => {
          const value = active === null ? null : series.vals[active];
          return (
            <circle
              key={series.name}
              className="hm"
              r="6.5"
              fill={series.color}
              stroke="var(--surface)"
              strokeWidth={2}
              cx={active === null ? 0 : X(active)}
              cy={value === null ? 0 : Y(si, value)}
              opacity={value === null ? 0 : 1}
            />
          );
        })}
      </svg>
    </div>
  );
}
export function StudyHeatmap({
  model,
  tooltip,
}: {
  model: AnalyticsModel;
  tooltip: TooltipActions;
}) {
  const scroll = useRef<HTMLDivElement>(null),
    heat = model.heatmap,
    cw = 15,
    ox = 30,
    oy = 18;
  useEffect(() => {
    if (scroll.current) scroll.current.scrollLeft = 1e5;
  }, []);
  return (
    <div className="hmw" ref={scroll}>
      <svg
        width={ox + heat.columns * cw}
        height={oy + 7 * cw}
        role="img"
        aria-label="Questions attempted per day over the last year"
      >
        {heat.months.map(({ column, label }) => (
          <text className="ax" key={column} x={ox + column * cw} y={11}>
            {label}
          </text>
        ))}
        {[1, 3, 5].map((i) => (
          <text className="ax" key={i} x={0} y={oy + i * cw + 10}>
            {WEEKDAYS[i]}
          </text>
        ))}
        {heat.cells.map((cell) => {
          const d = cell.date,
            n = cell.attempted,
            content = `${MONTHS[d.getMonth()]} ${d.getDate()} — ${n ? n + " question" + (n === 1 ? "" : "s") + " attempted" : "no questions attempted"}`;
          const show = (event: React.PointerEvent<SVGRectElement>) =>
            tooltip.show(content, event.clientX, event.clientY);
          return (
            <rect
              key={dateKey(d)}
              x={ox + cell.column * cw}
              y={oy + cell.row * cw}
              width={12}
              height={12}
              rx={3}
              fill={`var(--h${cell.level})`}
              data-analytics-tip={content}
              onPointerMove={show}
              onPointerDown={show}
            />
          );
        })}
      </svg>
    </div>
  );
}
export function TopicBars({
  model,
  subject,
  period,
  tooltip,
}: {
  model: AnalyticsModel;
  subject: "Critical Thinking" | "Problem Solving" | "Mathematics";
  period: Period;
  tooltip: TooltipActions;
}) {
  const rows = model.topics(subject, period),
    caption = model.caption(period),
    host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        host.current
          ?.querySelectorAll<HTMLElement>("i[data-w]")
          .forEach((fill) => {
            fill.style.width = fill.dataset.w + "%";
          });
      });
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [model, subject, period]);
  const low = rows.reduce((a, b) => (b.value < a.value ? b : a)),
    high = rows.reduce((a, b) => (b.value > a.value ? b : a));
  return (
    <>
      <div ref={host}>
        <div className="bax">
          <span />
          <div>
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
          <span />
        </div>
        {rows.map(({ name, value }) => {
          const content = (
            <>
              <b>
                {name} — {value}% accuracy
              </b>
              <br />
              {caption}
            </>
          );
          const show = (event: React.PointerEvent<HTMLDivElement>) =>
            tooltip.show(content, event.clientX, event.clientY);
          return (
            <div
              key={subject + period + name}
              className="br"
              tabIndex={0}
              data-analytics-tip={name}
              onPointerMove={show}
              onPointerDown={show}
              onFocus={(event) => {
                const r = event.currentTarget.getBoundingClientRect();
                tooltip.show(content, r.left + r.width / 2, r.top);
              }}
              onBlur={tooltip.hide}
            >
              <span className="bn">{name}</span>
              <div className="bt">
                <i data-w={value} data-l={accuracyLevel(value)} />
              </div>
              <b>{value}%</b>
            </div>
          );
        })}
      </div>
      <p className="ins">
        Strongest:{" "}
        <b>
          {high.name} ({high.value}%)
        </b>
        . Needs attention:{" "}
        <b>
          {low.name} ({low.value}%)
        </b>
        .
        <span className="lg" style={{ marginTop: 8 }}>
          <span>
            <i className="sw" style={{ background: "var(--ok)" }} />
            75% and above
          </span>
          <span>
            <i className="sw" style={{ background: "var(--mid)" }} />
            60–74%
          </span>
          <span>
            <i className="sw" style={{ background: "var(--bad)" }} />
            Below 60%
          </span>
        </span>
      </p>
    </>
  );
}
const RESULT_COLORS = {
  first: "var(--up)",
  up: "var(--up)",
  down: "var(--down)",
  same: "var(--same)",
};
const RESULT_LABELS = {
  first: "First attempt of this test",
  up: "Improved",
  down: "Declined",
  same: "Unchanged",
};
function ResultGlyph({ status }: { status: keyof typeof RESULT_LABELS }) {
  if (status === "first") return <circle r={2} fill="#fff" />;
  if (status === "same")
    return (
      <path
        d="M-3.5 0H3.5"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    );
  return (
    <path
      d={
        status === "up" ? "M-3.5 1.5L0-2.5L3.5 1.5" : "M-3.5-1.5L0 2.5L3.5-1.5"
      }
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
export function MockChart({
  model,
  tooltip,
}: {
  model: AnalyticsModel;
  tooltip: TooltipActions;
}) {
  const attempts = model.attempts,
    keys = [...new Set(attempts.map((a) => a.k))],
    { host, width: W } = useChartWidth(keys.length * 64 + 70);
  const H = 300,
    l = 48,
    r = 10,
    t = 14,
    b = 48,
    iw = W - l - r,
    ih = H - t - b,
    cw = iw / keys.length;
  const percentages = attempts.map((a) => a.p),
    lo = Math.max(0, Math.floor((Math.min(...percentages) - 12) / 10) * 10),
    hi = Math.min(100, Math.ceil((Math.max(...percentages) + 8) / 10) * 10),
    Y = (v: number) => t + ih - ((v - lo) / (hi - lo)) * ih;
  const ticks = Array.from(
    { length: Math.floor((hi - lo) / 10) + 1 },
    (_, i) => lo + i * 10,
  );
  return (
    <div className="scx" ref={host}>
      <svg
        width={W}
        height={H}
        role="group"
        aria-label="Mock test scores by date"
      >
        {ticks.map((v) => (
          <Fragment key={v}>
            <line className="gl" x1={l} x2={W - r} y1={Y(v)} y2={Y(v)} />
            <text className="ax" x={l - 8} y={Y(v) + 4} textAnchor="end">
              {v}%
            </text>
          </Fragment>
        ))}
        <text
          className="ax"
          transform={`translate(11 ${t + ih / 2}) rotate(-90)`}
          textAnchor="middle"
        >
          Score (% of maximum)
        </text>
        {keys.map((key, i) => {
          const group = attempts.filter((a) => a.k === key),
            x = l + (i + 0.5) * cw,
            max = Math.max(...group.map((a) => a.p)),
            min = Math.min(...group.map((a) => a.p));
          return (
            <Fragment key={key}>
              <text className="ax" x={x} y={H - 24} textAnchor="middle">
                {formatDay(group[0].d)}
              </text>
              <text
                className="ax"
                x={x}
                y={H - 8}
                textAnchor="middle"
                opacity=".7"
              >
                {group.length > 1 ? group.length + " tests" : "1 test"}
              </text>
              {group.length > 1 && (
                <rect
                  x={x - 15}
                  y={Y(max) - 10}
                  width={30}
                  height={Y(min) - Y(max) + 20}
                  rx={15}
                  fill="var(--sunken)"
                  stroke="var(--line2)"
                />
              )}
              {group.map((a) => {
                const y = Y(a.p),
                  content = (
                    <>
                      <b>
                        {formatDay(a.d)}, {a.t}
                      </b>
                      <br />
                      {a.n}
                      <br />
                      {a.s}/{a.m} · {a.p.toFixed(1)}%<br />
                      {RESULT_LABELS[a.st]}
                      {a.pv
                        ? " " +
                          (a.df > 0 ? "+" : "") +
                          a.df +
                          " pts vs " +
                          a.pv.s +
                          "/" +
                          a.pv.m
                        : ""}
                    </>
                  );
                const show = (event: React.PointerEvent<SVGGElement>) =>
                  tooltip.show(content, event.clientX, event.clientY);
                return (
                  <g
                    key={a.t}
                    className="mk"
                    tabIndex={0}
                    role="img"
                    data-analytics-tip={a.n}
                    aria-label={`${formatDay(a.d)}, ${a.n}, ${a.s} of ${a.m}, ${RESULT_LABELS[a.st]}`}
                    transform={`translate(${x} ${y})`}
                    onPointerMove={show}
                    onPointerDown={show}
                    onFocus={(event) => {
                      const r = event.currentTarget.getBoundingClientRect();
                      tooltip.show(content, r.left + r.width / 2, r.top);
                    }}
                    onBlur={tooltip.hide}
                  >
                    <rect
                      className="b"
                      x={-8}
                      y={-8}
                      width={16}
                      height={16}
                      rx={4}
                      fill={RESULT_COLORS[a.st]}
                      stroke="var(--surface)"
                      strokeWidth="1.5"
                    />
                    <ResultGlyph status={a.st} />
                  </g>
                );
              })}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
