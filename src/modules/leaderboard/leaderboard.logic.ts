import type { LeaderboardSnapshot, LeaderboardUser } from "./leaderboard.types";

/** Illustrative ordering only: solved count, accuracy, hard count, then stable ID. */
export function rankLeaderboard(users: LeaderboardUser[]) {
  return [...users]
    .sort(
      (a, b) =>
        b.questionsSolved - a.questionsSolved ||
        (b.accuracyRate ?? -1) - (a.accuracyRate ?? -1) ||
        b.hardQuestionsSolved - a.hardQuestionsSolved ||
        a.id.localeCompare(b.id),
    )
    .map((user, index) => ({ ...user, rank: index + 1 }));
}

export function leaderboardProgress(snapshot: LeaderboardSnapshot) {
  const rows = rankLeaderboard(snapshot.users);
  const current = rows.find((user) => user.id === snapshot.currentUserId);
  const previous =
    current && current.rank > 1 ? rows[current.rank - 2] : undefined;
  const remaining =
    previous && current
      ? previous.questionsSolved - current.questionsSolved + 1
      : 0;
  const weeklyChange = current?.comparison?.weeklyAccuracyChangePercent;
  const hardTopPercent = current?.comparison?.hardTopPercent;
  return {
    rows,
    current,
    highlights: {
      solved: current
        ? `Top ${current.rank} user${current.rank === 1 ? "" : "s"}`
        : "Ranking unavailable",
      accuracy:
        current?.accuracyRate != null && weeklyChange != null
          ? `${weeklyChange > 0 ? "+" : ""}${weeklyChange.toFixed(1)}% this week`
          : "No weekly comparison",
      hard:
        hardTopPercent != null
          ? `Top ${hardTopPercent}% users`
          : "Comparison unavailable",
    },
    advancement: current
      ? {
          rank: current.rank,
          targetRank: previous?.rank ?? null,
          remaining,
          withinCatalogue:
            current.questionsSolved + remaining <= snapshot.totalQuestions,
        }
      : null,
  };
}

/** Reload the supplied frontend snapshot without mutating its canonical fixture records. */
export function reloadLeaderboard(
  snapshot: LeaderboardSnapshot,
): LeaderboardSnapshot {
  return {
    ...snapshot,
    users: snapshot.users.map((user) =>
      user.comparison
        ? { ...user, comparison: { ...user.comparison } }
        : { ...user },
    ),
  };
}

export function leaderboardPercent(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

/** UTC snapshot time; Today is used only when it matches the viewer's current UTC day. */
export function leaderboardTimestamp(
  value: string,
  currentUtcDay: string | null,
) {
  const date = new Date(value);
  const day =
    date.toISOString().slice(0, 10) === currentUtcDay
      ? "Today"
      : new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  return `${day}, ${time} UTC`;
}
