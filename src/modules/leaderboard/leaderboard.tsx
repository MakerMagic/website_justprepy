"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { StatisticCard } from "../../components/statistic-card";
import { PracticeShell } from "../questions/practice-shell";
import {
  PracticeDialog,
  PracticeDialogClose,
} from "../questions/practice-dialog";
import { Icon } from "../questions/icon";
import type { QuestionBankData } from "../questions/question-bank.types";
import {
  leaderboardPercent,
  leaderboardProgress,
  leaderboardTimestamp,
  reloadLeaderboard,
} from "./leaderboard.logic";
import type { LeaderboardSnapshot } from "./leaderboard.types";
import { LeaderboardIcon } from "./leaderboard-icons";
import "../questions/practice-modals.css";
import "./leaderboard.css";

const number = new Intl.NumberFormat("en-US");
// A client-day snapshot avoids server/client date differences during hydration.
const subscribeToDay = () => () => {};
const currentUtcDay = () => new Date().toISOString().slice(0, 10);
const serverUtcDay = () => null;

function LeaderboardSymbol({ name }: { name: "trophy" | "solved" | "bolt" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "trophy" ? (
        <>
          <path
            d="M7 3h10v6a5 5 0 0 1-10 0V3Z"
            fill="currentColor"
            stroke="none"
          />
          <path
            d="M7 5H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4M12 14v5m-4 2h8m-6-2h4"
            strokeWidth="2"
          />
        </>
      ) : name === "solved" ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8 12 2.5 2.5 5.5-6" />
        </>
      ) : (
        <path
          d="m13.5 2-9 12h6l-1 8 10-13h-7l1-7Z"
          fill="currentColor"
          stroke="none"
        />
      )}
    </svg>
  );
}
type Preview = "solved" | "accuracy" | "hard" | "analytics";
const previewTitles: Record<Preview, string> = {
  solved: "Questions Solved",
  accuracy: "Accuracy Rate",
  hard: "Hard Questions Solved",
  analytics: "More Analytics",
};

export function Leaderboard({
  data,
  profile,
  telegramUrl,
}: {
  data: LeaderboardSnapshot;
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
}) {
  const [snapshot, setSnapshot] = useState(data);
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const frame = useRef<number | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const { rows, current, advancement, highlights } =
    leaderboardProgress(snapshot);
  const utcDay = useSyncExternalStore(
    subscribeToDay,
    currentUtcDay,
    serverUtcDay,
  );
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    [],
  );

  function refresh() {
    if (frame.current !== null) return;
    setRefreshing(true);
    frame.current = requestAnimationFrame(() => {
      setSnapshot(reloadLeaderboard(data));
      setRefreshedAt(new Date().toISOString());
      setRefreshing(false);
      frame.current = null;
    });
  }

  return (
    <PracticeShell
      profile={profile}
      telegramUrl={telegramUrl}
      skipLabel="Skip to leaderboard"
    >
      <main
        id="main-content"
        tabIndex={-1}
        className="bank-content leaderboard-content"
        data-ui
      >
        <section
          className="page-heading leaderboard-heading"
          aria-label="Leaderboard introduction"
        >
          <div className="intro-copy">
            <h1 className="leaderboard-title">
              <LeaderboardSymbol name="trophy" />
              Leaderboard
            </h1>
            <p>Illustrative practice rankings, ordered by questions solved.</p>
          </div>
          <div className="leaderboard-updates">
            <span className="leaderboard-timestamp" role="status">
              <span className="leaderboard-update-dot" aria-hidden="true" />
              <span>
                {refreshedAt ? "Reloaded locally: " : "Updated: "}
                <time dateTime={refreshedAt ?? snapshot.updatedAt}>
                  {leaderboardTimestamp(
                    refreshedAt ?? snapshot.updatedAt,
                    utcDay,
                  )}
                </time>
              </span>
            </span>
            <button
              type="button"
              className="button secondary leaderboard-refresh"
              onClick={refresh}
              disabled={refreshing}
              aria-busy={refreshing}
            >
              <LeaderboardIcon name="refresh" size={16} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </section>
        <section
          className="leaderboard-progress"
          aria-label="Your illustrative practice statistics"
        >
          <div className="leaderboard-stats practice-stats">
            <StatisticCard
              label="Questions Solved"
              value={
                current ? (
                  <>
                    {number.format(current.questionsSolved)}
                    <span className="leaderboard-stat-total">
                      {" "}
                      / {number.format(snapshot.totalQuestions)}
                    </span>
                  </>
                ) : (
                  "—"
                )
              }
              motif="check"
              secondary={highlights.solved}
              decoration={<LeaderboardSymbol name="solved" />}
              onClick={() => setPreview("solved")}
            />
            <StatisticCard
              label="Accuracy Rate"
              value={leaderboardPercent(current?.accuracyRate ?? null)}
              motif="trend"
              secondary={
                <>
                  {(current?.comparison?.weeklyAccuracyChangePercent ?? 0) >
                    0 && <LeaderboardIcon name="trend" size={14} />}
                  {highlights.accuracy}
                </>
              }
              decoration={<LeaderboardIcon name="trend" />}
              onClick={() => setPreview("accuracy")}
            />
            <StatisticCard
              label="Hard Questions Solved"
              value={
                current ? (
                  <>
                    {number.format(current.hardQuestionsSolved)}
                    <span className="leaderboard-stat-total"> questions</span>
                  </>
                ) : (
                  "—"
                )
              }
              motif="check"
              secondary={highlights.hard}
              decoration={<LeaderboardIcon name="flame" />}
              onClick={() => setPreview("hard")}
            />
          </div>
          <div className="leaderboard-analytics">
            <button
              type="button"
              className="button secondary"
              aria-haspopup="dialog"
              onClick={() => setPreview("analytics")}
            >
              More Analytics
              <Icon name="arrow" size={15} />
            </button>
          </div>
        </section>
        <section
          className="leaderboard-panel"
          aria-labelledby="leaderboard-table-title"
        >
          <header className="leaderboard-table-heading">
            <h2 id="leaderboard-table-title">GOAT Rankings</h2>
            <span>Demo snapshot · {rows.length} participants</span>
          </header>
          <div
            className="leaderboard-table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Leaderboard table; scroll horizontally to view all five columns"
          >
            <table className="leaderboard-table">
              <caption className="sr-only">
                Illustrative rankings ordered by questions solved, then accuracy
                and hard questions solved. Your row is labelled You.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Rank</th>
                  <th scope="col">User</th>
                  <th scope="col">Questions Solved</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Hard Solved</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => {
                  const self = user.id === snapshot.currentUserId;
                  return (
                    <tr
                      key={user.id}
                      data-current-user={self}
                      data-user-id={user.id}
                      data-podium={user.rank <= 3}
                    >
                      <td>
                        <span
                          className="leaderboard-rank"
                          data-top-three={user.rank <= 3}
                          data-first={user.rank === 1}
                          data-rank={user.rank}
                          aria-label={`Rank ${user.rank}${user.rank <= 3 ? ", top three" : ""}`}
                        >
                          {user.rank}
                        </span>
                      </td>
                      <th scope="row">
                        <div className="leaderboard-user">
                          <span
                            className="leaderboard-avatar"
                            aria-hidden="true"
                          >
                            {user.initials}
                          </span>
                          <span className="leaderboard-user-copy">
                            <span className="leaderboard-user-name">
                              {user.name}
                              {self && (
                                <span className="leaderboard-you">YOU</span>
                              )}
                            </span>
                            {user.title && (
                              <span className="leaderboard-user-title">
                                {user.title}
                              </span>
                            )}
                          </span>
                        </div>
                      </th>
                      <td>
                        <span className="leaderboard-count">
                          {number.format(user.questionsSolved)}
                        </span>
                        <span className="leaderboard-denominator">
                          {" "}
                          / {number.format(snapshot.totalQuestions)}
                        </span>
                      </td>
                      <td>
                        {user.rank <= 3 && user.accuracyRate !== null ? (
                          <span className="leaderboard-accuracy-pill">
                            {leaderboardPercent(user.accuracyRate)}
                          </span>
                        ) : (
                          leaderboardPercent(user.accuracyRate)
                        )}
                      </td>
                      <td
                        className={
                          user.rank <= 3
                            ? "leaderboard-hard-emphasis"
                            : undefined
                        }
                      >
                        {number.format(user.hardQuestionsSolved)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!rows.length && (
              <p className="leaderboard-empty">
                No rankings are available in this snapshot.
              </p>
            )}
          </div>
        </section>
        <section
          className="leaderboard-advancement"
          aria-labelledby="leaderboard-advancement-title"
        >
          <div className="leaderboard-advancement-copy">
            <span className="leaderboard-advancement-icon">
              <LeaderboardSymbol name="bolt" />
            </span>
            <div>
              <h2 id="leaderboard-advancement-title">Next Rank Advancement</h2>
              <p>
                {!advancement ? (
                  "Your ranking is not available in this demo snapshot."
                ) : advancement.targetRank === null ? (
                  <>
                    You’re ranked <strong>#1</strong> in this demo snapshot.
                    Keep building your practice.
                  </>
                ) : advancement.withinCatalogue ? (
                  <>
                    You need{" "}
                    <strong>
                      {number.format(advancement.remaining)} more questions
                      solved
                    </strong>{" "}
                    to reach{" "}
                    <strong className="leaderboard-target-rank">
                      Rank #{advancement.targetRank}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    You’re ranked <strong>#{advancement.rank}</strong>. You’ve
                    reached the available question limit; accuracy can decide
                    tied ranks.
                  </>
                )}
              </p>
            </div>
          </div>
          <Link className="button accent" href="/">
            Practice Now
            <Icon name="arrow" size={16} />
          </Link>
        </section>
      </main>
      <PracticeDialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        titleId="leaderboard-preview-title"
        className="topic-dialog leaderboard-preview"
      >
        <div className="popover-heading">
          <h2 id="leaderboard-preview-title">
            {preview ? previewTitles[preview] : "Practice statistics"}
          </h2>
          <PracticeDialogClose onClose={() => setPreview(null)} />
        </div>
        {preview === "analytics" ? (
          <p className="preview-note">
            Detailed analytics are not available in this frontend preview. The
            statistics shown here come from the illustrative practice snapshot.
          </p>
        ) : (
          <>
            <dl className="preview-stats">
              <div>
                <dt>
                  {preview ? previewTitles[preview] : "Practice statistics"}
                </dt>
                <dd>
                  {!current
                    ? "—"
                    : preview === "accuracy"
                      ? leaderboardPercent(current.accuracyRate)
                      : number.format(
                          preview === "hard"
                            ? current.hardQuestionsSolved
                            : current.questionsSolved,
                        )}
                </dd>
              </div>
              <div>
                <dt>
                  {preview === "accuracy"
                    ? "Questions completed"
                    : preview === "hard"
                      ? "All questions completed"
                      : "Available questions"}
                </dt>
                <dd>
                  {preview === "solved"
                    ? number.format(snapshot.totalQuestions)
                    : current
                      ? number.format(current.questionsSolved)
                      : "—"}
                </dd>
              </div>
            </dl>
            <p className="preview-note">
              Illustrative progress from the same records as your leaderboard
              row. Weekly change and population comparison labels are demo
              fixtures, not measured historical analytics.
            </p>
          </>
        )}
        <button
          type="button"
          className="button primary"
          onClick={() => setPreview(null)}
        >
          Back to Leaderboard
        </button>
      </PracticeDialog>
    </PracticeShell>
  );
}
