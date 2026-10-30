import { describe, expect, it, vi, afterEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { demoLeaderboard } from "../leaderboard/leaderboard.fixtures";
import { profileTitles } from "./settings.logic";
const state = vi.hoisted(() => ({ title: null as string | null }));
vi.mock("./settings-profile", async (original) => ({
  ...(await original<typeof import("./settings-profile")>()),
  useDemoProfile: () => ({
    version: 1,
    nickname: "MakerMagicNow",
    avatar: null,
    nicknameChangedAt: null,
    title: state.title,
  }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/leaderboard",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "test-title-font" }),
}));
import { ProfileTitle } from "./profile-title";
import { Sidebar } from "../questions/sidebar";
import { Leaderboard } from "../leaderboard/leaderboard";
import { SettingsPage } from "./settings-page";
afterEach(() => {
  state.title = null;
});
describe("Saved title presentation and identity", () => {
  for (const title of profileTitles)
    it(`preserves ${title.id} styling and emoji in all three locations`, () => {
      state.title = title.id;
      const titleMarkup = renderToStaticMarkup(<ProfileTitle id={title.id} />);
      expect(titleMarkup).toContain(title.className);
      expect(titleMarkup).toContain(title.text);
      if ("emoji" in title) expect(titleMarkup).toContain(title.emoji);
      const sidebar = renderToStaticMarkup(
        <Sidebar profile={demoQuestionBank.profile} />,
      );
      expect(sidebar).toContain(titleMarkup);
      const settings = renderToStaticMarkup(
        <SettingsPage profile={demoQuestionBank.profile} />,
      );
      expect(settings).toContain(titleMarkup);
      const leaderboard = renderToStaticMarkup(
        <Leaderboard
          profile={demoQuestionBank.profile}
          telegramUrl={null}
          data={demoLeaderboard}
        />,
      );
      const rows = leaderboard.match(
        /<tr[^>]*data-user-id="[^"]+"[^>]*>[\s\S]*?<\/tr>/g,
      )!;
      const self = rows.find((row) =>
        row.includes(`data-user-id="${demoLeaderboard.currentUserId}"`),
      )!;
      expect(self).toContain(titleMarkup);
      for (const row of rows.filter((row) => row !== self)) {
        expect(row).not.toContain("data-title-id=");
      }
      for (const user of demoLeaderboard.users.filter(
        (user) => user.id !== demoLeaderboard.currentUserId,
      ))
        expect(leaderboard).toContain(user.title);
    });
  it("leaves an absent title empty rather than inventing a default", () => {
    expect(renderToStaticMarkup(<ProfileTitle id={null} />)).toBe("");
    const sidebar = renderToStaticMarkup(
      <Sidebar profile={demoQuestionBank.profile} />,
    );
    expect(sidebar).not.toContain("data-title-id=");
    const html = renderToStaticMarkup(
      <Leaderboard
        profile={demoQuestionBank.profile}
        telegramUrl={null}
        data={demoLeaderboard}
      />,
    );
    const row = html.match(
      /<tr[^>]*data-user-id="demo-current-user"[^>]*>[\s\S]*?<\/tr>/,
    )![0];
    expect(row).not.toContain("leaderboard-user-title");
  });
});
