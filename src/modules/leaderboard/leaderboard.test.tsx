import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoLeaderboard } from "./leaderboard.fixtures";
import {
  leaderboardPercent,
  leaderboardProgress,
  rankLeaderboard,
  reloadLeaderboard,
  leaderboardTimestamp,
} from "./leaderboard.logic";
import { Leaderboard } from "./leaderboard";
import type { LeaderboardSnapshot, LeaderboardUser } from "./leaderboard.types";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { summarize } from "../questions/question-bank.logic";
import { Sidebar } from "../questions/sidebar";
import { StatisticCard } from "../../components/statistic-card";
import { LeaderboardIcon } from "./leaderboard-icons";

const route = vi.hoisted(() => ({ pathname: "/leaderboard" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
const user = (
  id: string,
  solved: number,
  accuracyRate: number | null = 80,
  hard = 1,
): LeaderboardUser => ({
  id,
  name: id,
  initials: id.slice(0, 2),
  questionsSolved: solved,
  accuracyRate,
  hardQuestionsSolved: hard,
});
function render(data = demoLeaderboard) {
  return renderToStaticMarkup(
    <Leaderboard
      data={data}
      profile={demoQuestionBank.profile}
      telegramUrl={null}
    />,
  );
}

describe("illustrative leaderboard", () => {
  it("keeps fixtures internally consistent with existing current-user progress", () => {
    const { current, rows } = leaderboardProgress(demoLeaderboard);
    const progress = summarize(demoQuestionBank.questions);
    expect(current).toMatchObject({
      name: demoQuestionBank.profile.name,
      initials: demoQuestionBank.profile.initials,
      questionsSolved: progress.answered,
      accuracyRate: progress.accuracy,
    });
    expect(current?.hardQuestionsSolved).toBe(
      summarize(
        demoQuestionBank.questions.filter((q) => q.difficulty === "hard"),
      ).answered,
    );
    expect(demoLeaderboard.totalQuestions).toBe(progress.total);
    expect(new Set(rows.map((row) => row.id)).size).toBe(rows.length);
    for (const row of rows) {
      expect(row.questionsSolved).toBeLessThanOrEqual(
        demoLeaderboard.totalQuestions,
      );
      expect(row.hardQuestionsSolved).toBeLessThanOrEqual(row.questionsSolved);
      expect(row.accuracyRate ?? 0).toBeLessThanOrEqual(100);
    }
  });
  it("orders by completed questions without altering source order", () => {
    const users = [user("b", 5), user("a", 20), user("c", 10)];
    expect(rankLeaderboard(users).map((row) => [row.id, row.rank])).toEqual([
      ["a", 1],
      ["c", 2],
      ["b", 3],
    ]);
    expect(users.map((row) => row.id)).toEqual(["b", "a", "c"]);
  });
  it("uses transparent deterministic tiebreaks rather than an invented aggregate score", () => {
    const users = [
      user("z", 10, null),
      user("c", 10, 90, 3),
      user("b", 10, 90, 5),
      user("a", 10, 90, 5),
      user("d", 10, 80, 9),
    ];
    expect(rankLeaderboard(users).map((row) => row.id)).toEqual([
      "a",
      "b",
      "c",
      "d",
      "z",
    ]);
    expect(rankLeaderboard([...users].reverse())).toEqual(
      rankLeaderboard(users),
    );
  });
  it("derives the next-rank gap from the preceding user", () => {
    const result = leaderboardProgress(demoLeaderboard);
    expect(result.advancement).not.toBeNull();
    const above = result.rows[result.current!.rank - 2];
    expect(result.advancement!.remaining).toBe(
      above.questionsSolved - result.current!.questionsSolved + 1,
    );
    expect(result.advancement!.targetRank).toBe(above.rank);
    const advanced = {
      ...demoLeaderboard,
      users: demoLeaderboard.users.map((row) =>
        row.id === result.current!.id
          ? {
              ...row,
              questionsSolved:
                row.questionsSolved + result.advancement!.remaining,
            }
          : row,
      ),
    };
    expect(leaderboardProgress(advanced).current!.rank).toBeLessThan(
      result.current!.rank,
    );
  });
  it("requires one additional completion to exceed an equal solved count", () => {
    const data: LeaderboardSnapshot = {
      ...demoLeaderboard,
      currentUserId: "self",
      users: [user("other", 10, 90), user("self", 10, 80)],
    };
    expect(leaderboardProgress(data).advancement).toMatchObject({
      rank: 2,
      targetRank: 1,
      remaining: 1,
    });
  });
  it("handles rank one, missing users, empty data and catalogue limits", () => {
    const first = {
      ...demoLeaderboard,
      currentUserId: "self",
      users: [user("self", 10)],
    };
    expect(leaderboardProgress(first).advancement).toMatchObject({
      rank: 1,
      targetRank: null,
      remaining: 0,
    });
    expect(leaderboardProgress({ ...first, users: [] }).advancement).toBeNull();
    expect(
      leaderboardProgress({ ...first, currentUserId: "absent" }).current,
    ).toBeUndefined();
    const capped = {
      ...first,
      totalQuestions: 10,
      users: [user("other", 10, 90), user("self", 10, 80)],
    };
    expect(leaderboardProgress(capped).advancement?.withinCatalogue).toBe(
      false,
    );
    expect(render(capped)).toContain("available question limit");
  });
  it("reloads only supplied fixtures and leaves snapshot time and source records unchanged", () => {
    const before = JSON.stringify(demoLeaderboard);
    const reloaded = reloadLeaderboard(demoLeaderboard);
    expect(reloaded).toEqual(demoLeaderboard);
    expect(reloaded).not.toBe(demoLeaderboard);
    expect(reloaded.users[0]).not.toBe(demoLeaderboard.users[0]);
    reloaded.users[0].questionsSolved = 0;
    expect(JSON.stringify(demoLeaderboard)).toBe(before);
    expect(reloadLeaderboard(demoLeaderboard).updatedAt).toBe(
      demoLeaderboard.updatedAt,
    );
    const reloadedCurrent = reloaded.users.find(
      (row) => row.id === demoLeaderboard.currentUserId,
    )!;
    const originalCurrent = demoLeaderboard.users.find(
      (row) => row.id === demoLeaderboard.currentUserId,
    )!;
    expect(reloadedCurrent.comparison).not.toBe(originalCurrent.comparison);
    reloadedCurrent.comparison!.weeklyAccuracyChangePercent = -9;
    expect(originalCurrent.comparison!.weeklyAccuracyChangePercent).toBe(2.1);
  });
  it("formats missing percentages separately from genuine zero", () => {
    expect(leaderboardPercent(null)).toBe("—");
    expect(leaderboardPercent(0)).toBe("0.0%");
    expect(leaderboardPercent(88)).toBe("88.0%");
  });
  it("derives solved rank and uses only the current user's explicit demo comparisons", () => {
    const result = leaderboardProgress(demoLeaderboard);
    expect(result.highlights).toEqual({
      solved: `Top ${result.current!.rank} users`,
      accuracy: "+2.1% this week",
      hard: "Top 5% users",
    });
    const empty = leaderboardProgress({ ...demoLeaderboard, users: [] });
    expect(empty.highlights).toEqual({
      solved: "Ranking unavailable",
      accuracy: "No weekly comparison",
      hard: "Comparison unavailable",
    });
    const zero = leaderboardProgress({
      ...demoLeaderboard,
      currentUserId: "zero",
      users: [user("zero", 0, null, 0)],
    });
    expect(zero.highlights.hard).toBe("Comparison unavailable");
    expect(zero.highlights.accuracy).toBe("No weekly comparison");
    const single = leaderboardProgress({
      ...demoLeaderboard,
      currentUserId: "one",
      users: [user("one", 1, 100, 1)],
    });
    expect(single.highlights.solved).toBe("Top 1 user");
    expect(single.highlights.accuracy).toBe("No weekly comparison");
    expect(single.highlights.hard).toBe("Comparison unavailable");
    const switched = leaderboardProgress({
      ...demoLeaderboard,
      currentUserId: "demo-sanzhar",
    });
    expect(switched.highlights.accuracy).toBe("No weekly comparison");
    expect(switched.highlights.hard).toBe("Comparison unavailable");
  });
  it.each([
    [2.1, "+2.1% this week"],
    [0, "0.0% this week"],
    [-1.2, "-1.2% this week"],
  ] as const)(
    "preserves the sign of a supplied %s weekly change",
    (change, label) => {
      const data = {
        ...demoLeaderboard,
        users: demoLeaderboard.users.map((row) =>
          row.id === demoLeaderboard.currentUserId
            ? { ...row, comparison: { weeklyAccuracyChangePercent: change } }
            : row,
        ),
      };
      expect(leaderboardProgress(data).highlights.accuracy).toBe(label);
    },
  );
  it("formats Today against the actual UTC day and keeps older snapshot dates honest", () => {
    expect(leaderboardTimestamp("2026-10-25T04:00:00Z", "2026-10-25")).toBe(
      "Today, 04:00 AM UTC",
    );
    expect(leaderboardTimestamp("2026-10-25T04:00:00Z", "2026-10-26")).toBe(
      "25 Oct, 04:00 AM UTC",
    );
    expect(leaderboardTimestamp("2026-10-25T04:00:00Z", null)).toBe(
      "25 Oct, 04:00 AM UTC",
    );
    expect(
      leaderboardTimestamp("2026-10-25T01:00:00+05:00", "2026-10-24"),
    ).toBe("Today, 08:00 PM UTC");
  });
  it("renders exactly five semantic table columns and five cells for every user", () => {
    const html = render();
    const head = html.match(/<thead>([\s\S]*?)<\/thead>/)![1];
    expect(
      [...head.matchAll(/<th scope="col">(.*?)<\/th>/g)].map(
        (match) => match[1],
      ),
    ).toEqual(["Rank", "User", "Questions Solved", "Accuracy", "Hard Solved"]);
    const body = html.match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
    const rows = [...body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)];
    expect(rows).toHaveLength(demoLeaderboard.users.length);
    rows.forEach((row) =>
      expect(row[1].match(/<(?:td|th)\b/g)).toHaveLength(5),
    );
    expect(html).toContain('role="region"');
    expect(html).toContain("scroll horizontally");
  });
  it("identifies current user by ID and distinguishes exactly the top three", () => {
    const html = render();
    expect(html.match(/data-current-user="true"/g)).toHaveLength(1);
    expect(html).toContain(
      `data-current-user="true" data-user-id="${demoLeaderboard.currentUserId}"`,
    );
    expect(html.match(/data-top-three="true"/g)).toHaveLength(3);
    expect(html.match(/data-first="true"/g)).toHaveLength(1);
    expect(html).toContain('class="leaderboard-you">YOU');
    expect(html.match(/data-podium="true"/g)).toHaveLength(3);
    for (const rank of [1, 2, 3]) {
      expect(html).toContain(`data-rank="${rank}"`);
    }
    for (const row of demoLeaderboard.users.filter(
      (user) => user.id !== demoLeaderboard.currentUserId,
    )) {
      expect(html).toContain(`class="leaderboard-user-title">${row.title}`);
    }
    expect(
      render({ ...demoLeaderboard, users: [user("plain", 1)] }),
    ).not.toContain('class="leaderboard-user-title"');
  });
  it("uses the shared stat-card component for exactly three consistent metrics", () => {
    const html = render();
    const { current } = leaderboardProgress(demoLeaderboard);
    expect(html.match(/class="stat-card"/g)).toHaveLength(3);
    expect(html).toContain('class="stat-label">Questions Solved');
    expect(html).toContain('class="stat-label">Accuracy Rate');
    expect(html).toContain('class="stat-label">Hard Questions Solved');
    expect(html).toContain(
      `class="stat-value">${leaderboardPercent(current!.accuracyRate)}`,
    );
    expect(html).toContain(
      'class="stat-value">' + current!.hardQuestionsSolved,
    );
    expect(html.match(/class="stat-secondary"/g)).toHaveLength(3);
    expect(html.match(/class="stat-decoration"/g)).toHaveLength(3);
    expect(html).toContain(
      leaderboardProgress(demoLeaderboard).highlights.solved,
    );
    expect(html).toContain(
      leaderboardProgress(demoLeaderboard).highlights.accuracy,
    );
    expect(html).toContain(
      leaderboardProgress(demoLeaderboard).highlights.hard,
    );
  });
  it("renders accuracy pills and unboxed hard-solved emphasis only for the top three", () => {
    const body = render().match(/<tbody>([\s\S]*?)<\/tbody>/)![1];
    const rows = [
      ...body.matchAll(
        /<tr[^>]*data-podium="(true|false)"[^>]*>([\s\S]*?)<\/tr>/g,
      ),
    ];
    expect(rows).toHaveLength(demoLeaderboard.users.length);
    expect(body.match(/class="leaderboard-accuracy-pill"/g)).toHaveLength(3);
    expect(body.match(/class="leaderboard-hard-emphasis"/g)).toHaveLength(3);
    for (const [, podium, row] of rows) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
      expect(cells[2][1].includes('class="leaderboard-accuracy-pill"')).toBe(
        podium === "true",
      );
      expect(cells[3][1]).toMatch(/^\d+$/);
      expect(row.includes('class="leaderboard-hard-emphasis"')).toBe(
        podium === "true",
      );
    }
  });
  it("does not present a missing top-three accuracy as a positive percentage pill", () => {
    const html = render({
      ...demoLeaderboard,
      users: [user("unmeasured", 1, null)],
    });
    expect(html).not.toContain('class="leaderboard-accuracy-pill"');
    expect(html).toContain("—");
  });
  it("reuses sourced decorative icons for Refresh, flame and both trend locations", () => {
    const html = render();
    expect(html.match(/data-leaderboard-icon="refresh"/g)).toHaveLength(1);
    expect(html.match(/data-leaderboard-icon="flame"/g)).toHaveLength(1);
    expect(html.match(/data-leaderboard-icon="trend"/g)).toHaveLength(2);
    for (const name of ["refresh", "flame", "trend"] as const) {
      const icon = renderToStaticMarkup(
        <LeaderboardIcon name={name} size={16} />,
      );
      expect(icon).toContain('width="16" height="16"');
      expect(icon).toContain('viewBox="0 0 24 24"');
      expect(icon).toContain('stroke-width="2"');
      expect(icon).toContain('aria-hidden="true" focusable="false"');
    }
  });
  it("preserves shared statistics defaults for Question Bank and Mock Tests", () => {
    for (const motif of ["check", "trend"] as const) {
      const html = renderToStaticMarkup(
        <StatisticCard
          label="Existing statistic"
          value={10}
          motif={motif}
          onClick={() => {}}
        />,
      );
      expect(html).toContain('class="stat-card"');
      expect(html).toContain('aria-haspopup="dialog"');
      expect(html).toContain('class="stat-motif"');
      expect(html).not.toContain("stat-secondary");
      expect(html).not.toContain("stat-decoration");
    }
  });
  it("exposes honest refresh, analytics and the sidebar's main Question Bank destination without filters", () => {
    const html = render();
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)![1];
    expect(main).toContain("Updated: ");
    expect(main).toContain("Illustrative practice rankings");
    expect(main).toContain('class="leaderboard-update-dot" aria-hidden="true"');
    expect(main).toContain('class="leaderboard-title"');
    expect(main.match(/datetime="([^"]+)"/i)?.[1]).toBe(
      demoLeaderboard.updatedAt,
    );
    expect(main).toContain("Refresh");
    expect(main).toContain("More Analytics");
    expect(main).toContain("Next Rank Advancement");
    const links = [
      ...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g),
    ];
    const questionBankHref = links.find(([, , content]) =>
      content.includes("<span>Question Bank</span>"),
    )?.[1];
    const practiceNowHref = links.find(([, , content]) =>
      content.includes("Practice Now"),
    )?.[1];
    expect(questionBankHref).toBe("/app");
    expect(practiceNowHref).toBe("/");
    expect(main).not.toContain('href="/practice"');
    expect(main).not.toContain("filter");
    expect(html).toContain("NUET Preparation");
  });
  it("renders unavailable states without inventing current-user progress", () => {
    const html = render({ ...demoLeaderboard, users: [] });
    expect(html).toContain("No rankings are available");
    expect(html).toContain("Your ranking is not available");
    expect(html).not.toContain('data-current-user="true"');
  });
  it.each(["/app", "/practice", "/mock-tests", "/leaderboard"])(
    "selects only the correct sidebar destination at %s",
    (pathname) => {
      route.pathname = pathname;
      const html = renderToStaticMarkup(
        <Sidebar profile={demoQuestionBank.profile} />,
      );
      const active =
        pathname === "/practice" || pathname === "/app" ? "/app" : pathname;
      const links =
        html.match(/<a[^>]*class="nav-item is-active"[^>]*>/g) ?? [];
      expect(links).toHaveLength(1);
      expect(links[0]).toContain(`href="${active}"`);
      expect(html).toContain('href="/leaderboard"');
      route.pathname = "/leaderboard";
    },
  );
});
