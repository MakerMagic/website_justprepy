"use client";
import {
  Fragment,
  useCallback,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { TooltipActions } from "./analytics-charts";
import { formatDay, smoothPath, monotonePath } from "./analytics.logic";
import {
  POPUP_CONFIGURATIONS,
  popupNiceMaximum,
  wrapPopupLabel,
  type PopupConfiguration,
  type PopupAnalyticsModel,
} from "./analytics-popups.logic";

function usePopupWidth(minimum: number) {
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
function tipEvents(content: ReactNode, tooltip: TooltipActions) {
  return {
    onPointerMove: (event: React.PointerEvent<SVGElement>) =>
      tooltip.show(content, event.clientX, event.clientY),
    onPointerDown: (event: React.PointerEvent<SVGElement>) =>
      tooltip.show(content, event.clientX, event.clientY),
    onPointerLeave: tooltip.hide,
    onFocus: (event: React.FocusEvent<SVGElement>) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      tooltip.show(content, bounds.left + bounds.width / 2, bounds.top);
    },
    onBlur: tooltip.hide,
  };
}
export type PopupBarSeries = { name: string; vals: number[]; color?: string };
export function PopupBarChart({
  labels,
  full,
  series,
  maximum,
  unit = "",
  ytitle,
  wrap = false,
  slot = 60,
  aria,
  tooltip,
  content,
  colorFor,
  redraw,
}: {
  labels: string[];
  full: string[];
  series: PopupBarSeries[];
  maximum?: number;
  unit?: string;
  ytitle?: string;
  wrap?: boolean;
  slot?: number;
  aria: string;
  tooltip: TooltipActions;
  content: (i: number, series: PopupBarSeries, value: number) => ReactNode;
  colorFor?: (value: number) => string;
  redraw: number;
}) {
  const { host, width: W } = usePopupWidth(labels.length * slot + 56);
  const H = 280,
    l = 46,
    t = 18,
    b = wrap ? 62 : 30,
    iw = W - l - 8,
    ih = H - t - b;
  const maximumValue =
    maximum ??
    popupNiceMaximum(Math.max(1, ...series.flatMap((item) => item.vals)));
  const space = iw / labels.length,
    bw = Math.min(38, (space * 0.72) / series.length),
    gw = series.length * bw + (series.length - 1) * 3;
  const Y = (value: number) => t + ih - (value / maximumValue) * ih;
  const signature = [
    redraw,
    W,
    labels.join("|"),
    ...series.map((item) => item.name + item.vals.join(",")),
  ].join(":");
  return (
    <div className="scx" ref={host}>
      <svg key={signature} width={W} height={H} role="group" aria-label={aria}>
        {[0, 1, 2, 3, 4].map((i) => {
          const value = (maximumValue * i) / 4,
            y = Y(value);
          return (
            <Fragment key={i}>
              <line className="gl" x1={l} x2={W - 8} y1={y} y2={y} />
              <text className="ax" x={l - 8} y={y + 4} textAnchor="end">
                {Math.round(value)}
                {unit}
              </text>
            </Fragment>
          );
        })}
        {ytitle && (
          <text
            className="ax"
            transform={"translate(11 " + (t + ih / 2) + ") rotate(-90)"}
            textAnchor="middle"
          >
            {ytitle}
          </text>
        )}
        {labels.map((label, i) => {
          const cx = l + space * (i + 0.5);
          return (
            <Fragment key={i}>
              <text className="ax" textAnchor="middle" x={cx} y={H - b + 16}>
                {(wrap ? wrapPopupLabel(label) : [label]).map((line, j) => (
                  <tspan key={j} x={cx} dy={j ? 13 : 0}>
                    {line}
                  </tspan>
                ))}
              </text>
              {series.map((item, j) => {
                const value = item.vals[i],
                  x = cx - gw / 2 + j * (bw + 3),
                  height = Math.max(0, (value / maximumValue) * ih),
                  y = t + ih - height,
                  r = Math.min(5, bw / 2, height);
                return (
                  <Fragment key={item.name}>
                    <path
                      className="bar"
                      tabIndex={0}
                      aria-label={
                        full[i] + ", " + item.name + ", " + value + unit
                      }
                      fill={colorFor ? colorFor(value) : item.color}
                      d={
                        "M" +
                        x +
                        "," +
                        (t + ih) +
                        "V" +
                        (y + r) +
                        "Q" +
                        x +
                        "," +
                        y +
                        " " +
                        (x + r) +
                        "," +
                        y +
                        "H" +
                        (x + bw - r) +
                        "Q" +
                        (x + bw) +
                        "," +
                        y +
                        " " +
                        (x + bw) +
                        "," +
                        (y + r) +
                        "V" +
                        (t + ih) +
                        "Z"
                      }
                      style={{ animationDelay: i * 30 + "ms" }}
                      {...tipEvents(content(i, item, value), tooltip)}
                    />
                    {series.length === 1 && bw >= 20 && (
                      <text
                        className="vl"
                        x={x + bw / 2}
                        y={y - 6}
                        textAnchor="middle"
                      >
                        {value}
                        {unit}
                      </text>
                    )}
                  </Fragment>
                );
              })}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
export function PopupLineChart({
  labels,
  full,
  values,
  color,
  name,
  aria,
  area = false,
  maximum,
  unit = "",
  format,
  bounded = false,
  tooltip,
  redraw,
}: {
  labels: string[];
  full: string[];
  values: (number | null)[];
  color: string;
  name: string;
  aria: string;
  area?: boolean;
  maximum?: number;
  unit?: string;
  format: (value: number | null) => string;
  bounded?: boolean;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const { host, width: W } = usePopupWidth(280),
    [active, setActive] = useState<number | null>(null),
    current = useRef(0);
  const H = 250,
    l = 48,
    r = 14,
    t = 12,
    b = 30,
    iw = W - l - r,
    ih = H - t - b,
    n = labels.length;
  const high =
    maximum ??
    popupNiceMaximum(
      Math.max(1, ...values.filter((value): value is number => value !== null)),
    );
  const X = (i: number) => l + 18 + (i * (iw - 36)) / Math.max(1, n - 1),
    Y = (value: number) => t + ih - (value / high) * ih;
  const points = values.flatMap((value, i) =>
    value === null ? [] : [[X(i), Y(value)]],
  );
  const path = bounded ? monotonePath(points) : smoothPath(points);
  const show = (index: number, svg: SVGSVGElement) => {
    const i = Math.max(0, Math.min(n - 1, index));
    current.current = i;
    setActive(i);
    const bounds = svg.getBoundingClientRect(),
      value = values[i];
    tooltip.show(
      <>
        <b>{full[i]}</b>
        <div className="r">
          <i className="dot" style={{ background: color }} />
          {name}: <b>{format(value)}</b>
        </div>
      </>,
      bounds.left + (X(i) * bounds.width) / W,
      bounds.top + (value === null ? t : Y(value)),
    );
  };
  const hide = () => {
    setActive(null);
    tooltip.hide();
  };
  const at = (event: React.PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect(),
      x = ((event.clientX - bounds.left) * W) / bounds.width;
    show(
      Math.round((x - l - 18) / ((iw - 36) / Math.max(1, n - 1))),
      event.currentTarget,
    );
  };
  return (
    <div className="scx" ref={host}>
      <svg
        key={redraw + ":" + W + ":" + values.join(",")}
        className="lc"
        viewBox={"0 0 " + W + " " + H}
        width={W}
        height={H}
        tabIndex={0}
        role="img"
        aria-label={aria}
        onPointerMove={at}
        onPointerDown={at}
        onPointerLeave={hide}
        onBlur={hide}
        onFocus={(event) => show(current.current, event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            show(
              current.current + (event.key === "ArrowRight" ? 1 : -1),
              event.currentTarget,
            );
          }
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const value = (high * i) / 4,
            y = Y(value);
          return (
            <Fragment key={i}>
              <line className="gl" x1={l} x2={W - r} y1={y} y2={y} />
              <text className="ax" x={l - 8} y={y + 4} textAnchor="end">
                {Math.round(value)}
                {unit}
              </text>
            </Fragment>
          );
        })}
        {labels.map((label, i) => (
          <text key={i} className="ax" x={X(i)} y={H - 8} textAnchor="middle">
            {label}
          </text>
        ))}
        {area && points.length > 0 && (
          <path
            d={
              path +
              "L" +
              points.at(-1)![0] +
              "," +
              (t + ih) +
              "L" +
              points[0][0] +
              "," +
              (t + ih) +
              "Z"
            }
            fill={color}
            opacity=".14"
          />
        )}
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point[0]}
            cy={point[1]}
            r={4}
            fill="var(--surface)"
            stroke={color}
            strokeWidth={2}
          />
        ))}
        {active !== null && (
          <>
            <line
              x1={X(active)}
              x2={X(active)}
              y1={t}
              y2={t + ih}
              stroke="var(--line2)"
              strokeDasharray="3 3"
            />
            {values[active] !== null && (
              <circle
                cx={X(active)}
                cy={Y(values[active]!)}
                r="6.5"
                fill={color}
                stroke="var(--surface)"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </svg>
    </div>
  );
}
export function PopupRadarChart({
  rows,
  aria,
  tooltip,
  redraw,
}: {
  rows: { name: string; value: number; attempted: number }[];
  aria: string;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const W = 460,
    H = 370,
    cx = W / 2,
    cy = H / 2 + 4,
    R = 110,
    n = rows.length;
  const A = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n,
    P = (i: number, value: number) => [
      cx + (Math.cos(A(i)) * R * value) / 100,
      cy + (Math.sin(A(i)) * R * value) / 100,
    ];
  const points = (value: number) =>
    rows.map((_, i) => P(i, value).join(",")).join(" ");
  return (
    <svg
      viewBox={"0 0 " + W + " " + H}
      width="100%"
      role="group"
      aria-label={aria}
      style={{ maxWidth: 520, display: "block", margin: "0 auto" }}
    >
      {[20, 40, 60, 80, 100].map((value) => (
        <Fragment key={value}>
          <polygon points={points(value)} fill="none" stroke="var(--line)" />
          <text
            className="ax"
            x={cx + 4}
            y={cy - (R * value) / 100 + 11}
            style={{ fontSize: 10 }}
          >
            {value}%
          </text>
        </Fragment>
      ))}
      {rows.map((row, i) => {
        const end = P(i, 100),
          x = cx + Math.cos(A(i)) * (R + 14),
          y = cy + Math.sin(A(i)) * (R + 14),
          cos = Math.cos(A(i)),
          anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end",
          lines = wrapPopupLabel(row.name, 14);
        return (
          <Fragment key={row.name}>
            <line className="gl" x1={cx} y1={cy} x2={end[0]} y2={end[1]} />
            <text
              className="ax"
              textAnchor={anchor}
              style={{ fontSize: 12.5, fill: "var(--ink)" }}
              x={x}
              y={
                y +
                (Math.sin(A(i)) > 0.5
                  ? 10
                  : Math.sin(A(i)) < -0.5
                    ? -6 * lines.length + 4
                    : 4 - (lines.length - 1) * 6)
              }
            >
              {lines.map((line, j) => (
                <tspan key={j} x={x} dy={j ? 14 : 0}>
                  {line}
                </tspan>
              ))}
            </text>
          </Fragment>
        );
      })}
      <g
        key={redraw + ":" + rows.map((row) => row.name).join("|")}
        className="pop"
      >
        <polygon
          points={rows.map((row, i) => P(i, row.value).join(",")).join(" ")}
          fill="var(--bad)"
          fillOpacity=".18"
          stroke="var(--bad)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {rows.map((row, i) => {
          const p = P(i, row.value);
          return (
            <circle
              key={row.name}
              className="vt"
              tabIndex={0}
              cx={p[0]}
              cy={p[1]}
              r="5.5"
              fill="var(--surface)"
              stroke="var(--bad)"
              strokeWidth="2.5"
              aria-label={row.name + ", error rate " + row.value + "%"}
              {...tipEvents(
                <>
                  <b>{row.name}</b>
                  <br />
                  Error rate: <b>{row.value}%</b>
                  <br />≈ {Math.round(
                    (row.value / 100) * row.attempted,
                  )} of {row.attempted} attempted
                </>,
                tooltip,
              )}
            />
          );
        })}
      </g>
    </svg>
  );
}
const SCORE_MESSAGES = {
  first: "First attempt of this test",
  up: "Improved",
  down: "Declined",
  same: "Unchanged",
};
const SCORE_COLORS = {
  first: "var(--ok)",
  up: "var(--ok)",
  down: "var(--bad)",
  same: "var(--same)",
};
function ScoreGlyph({ status }: { status: keyof typeof SCORE_MESSAGES }) {
  if (status === "first") return <circle r={2} fill="#fff" />;
  return (
    <path
      d={
        status === "up"
          ? "M-3.5 1.5L0-2.5L3.5 1.5"
          : status === "down"
            ? "M-3.5-1.5L0 2.5L3.5-1.5"
            : "M-3.5 0H3.5"
      }
      fill="none"
      stroke="#fff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
export function PopupScoreChart({
  model,
  configuration,
  tooltip,
  redraw,
}: {
  model: PopupAnalyticsModel;
  configuration: PopupConfiguration;
  tooltip: TooltipActions;
  redraw: number;
}) {
  const list = model.attempts.filter(
      (attempt) => attempt.cfg === configuration,
    ),
    days = [...new Set(list.map((attempt) => attempt.key))];
  const { host, width: W } = usePopupWidth(days.length * 70 + 70);
  const H = 300,
    l = 50,
    r = 10,
    t = 14,
    b = 48,
    iw = W - l - r,
    ih = H - t - b,
    space = iw / days.length,
    maximum = POPUP_CONFIGURATIONS[configuration].m;
  const Y = (value: number) => t + ih - (value / maximum) * ih;
  return (
    <div className="scx" ref={host}>
      <svg
        key={redraw + ":" + configuration + ":" + W}
        width={W}
        height={H}
        role="group"
        aria-label={POPUP_CONFIGURATIONS[configuration].n + " scores by date"}
      >
        {[0, 1, 2, 3, 4].map((i) => {
          const value = (maximum * i) / 4;
          return (
            <Fragment key={i}>
              <line
                className="gl"
                x1={l}
                x2={W - r}
                y1={Y(value)}
                y2={Y(value)}
              />
              <text className="ax" x={l - 8} y={Y(value) + 4} textAnchor="end">
                {value}
              </text>
            </Fragment>
          );
        })}
        <text
          className="ax"
          transform={"translate(11 " + (t + ih / 2) + ") rotate(-90)"}
          textAnchor="middle"
        >
          Score (out of {maximum})
        </text>
        {days.map((day, i) => {
          const group = list.filter((attempt) => attempt.key === day),
            x = l + (i + 0.5) * space;
          return (
            <Fragment key={day}>
              <text className="ax" x={x} y={H - 24} textAnchor="middle">
                {formatDay(group[0].date)}
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
                  y={Y(Math.max(...group.map((a) => a.s))) - 10}
                  width={30}
                  height={
                    Y(Math.min(...group.map((a) => a.s))) -
                    Y(Math.max(...group.map((a) => a.s))) +
                    20
                  }
                  rx={15}
                  fill="var(--sunken)"
                  stroke="var(--line2)"
                />
              )}
              {group.map((attempt) => (
                <g
                  key={attempt.t}
                  className="mk"
                  tabIndex={0}
                  role="img"
                  aria-label={
                    formatDay(attempt.date) +
                    ", " +
                    attempt.n +
                    ", " +
                    attempt.s +
                    " of " +
                    attempt.m +
                    ", " +
                    SCORE_MESSAGES[attempt.st]
                  }
                  transform={"translate(" + x + " " + Y(attempt.s) + ")"}
                  {...tipEvents(
                    <>
                      <b>
                        {formatDay(attempt.date)}, {attempt.t}
                      </b>
                      <br />
                      {attempt.n}
                      <br />
                      {attempt.s} / {attempt.m} points
                      <br />
                      {SCORE_MESSAGES[attempt.st]}
                      {attempt.pv
                        ? " " +
                          (attempt.df > 0 ? "+" : "") +
                          attempt.df +
                          " vs " +
                          attempt.pv.s +
                          " / " +
                          attempt.pv.m
                        : ""}
                    </>,
                    tooltip,
                  )}
                >
                  <rect
                    className="b"
                    x={-8}
                    y={-8}
                    width={16}
                    height={16}
                    rx={4}
                    fill={SCORE_COLORS[attempt.st]}
                    stroke="var(--surface)"
                    strokeWidth="1.5"
                  />
                  <ScoreGlyph status={attempt.st} />
                </g>
              ))}
            </Fragment>
          );
        })}
      </svg>
    </div>
  );
}
