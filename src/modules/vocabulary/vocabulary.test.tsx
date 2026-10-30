import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { StatisticCard } from "../../components/statistic-card";
import { Sidebar } from "../questions/sidebar";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { Vocabulary, VocabularyPresetCard } from "./vocabulary";
import { demoVocabulary } from "./vocabulary.fixtures";
const route = vi.hoisted(() => ({ pathname: "/vocabulary" }));
vi.mock("next/navigation", () => ({
  usePathname: () => route.pathname,
  useRouter: () => ({ push: vi.fn() }),
}));
describe("Vocabulary screenshot integration", () => {
  it("recreates exactly three presets with the shared shell and no Filters section", () => {
    const html = renderToStaticMarkup(
      <Vocabulary
        data={demoVocabulary}
        profile={demoQuestionBank.profile}
        telegramUrl={null}
      />,
    );
    for (const text of [
      "Master your vocabulary",
      "Words Learned",
      "148",
      "Retention Rate",
      "84%",
      "Presets",
      "3 Available",
      "My Words",
      "High-Frequency NUET Core",
      "Advanced Tone &amp; Fallacies",
      "42 Words available",
      "320 Words available",
      "185 Words available",
      "NUET Preparation",
      "Join Our Telegram Channel",
    ])
      expect(html).toContain(text);
    expect(html.match(/class="vocabulary-preset"/g)).toHaveLength(3);
    expect(html.match(/class="stat-decoration"/g)).toHaveLength(2);
    expect(html).toContain('data-vocabulary-icon="book"');
    expect(html).toContain('data-vocabulary-icon="growth"');
    expect(html).toContain('data-vocabulary-icon="presets"');
    expect(html.match(/data-vocabulary-icon="tag"/g)).toHaveLength(3);
    expect(html.match(/type="checkbox"/g)).toHaveLength(3);
    expect(html).not.toContain('type="radio"');
    expect(html.match(/checked=""/g)).toHaveLength(1);
    expect(html).toMatch(
      /<input(?=[^>]*value="my-words")(?=[^>]*checked="")[^>]*>/,
    );
    expect(html).toContain('class="sidebar"');
    expect(html.match(/aria-label="Inspect Words in /g)).toHaveLength(3);
    expect(html).not.toContain("Word lists are not connected");
    expect(html).not.toContain("Vocabulary practice is not available");
    expect(html).toMatch(/class="button vocabulary-practice"/);
    expect(html).not.toContain("Unit 3 words");
    expect(html).not.toContain("Filter Words");
    expect(html).not.toContain('class="filters-panel"');
    expect(html).not.toMatch(/>Active<|>Standard<|>Hard</);
  });
  it("reuses static statistic cards without adding buttons and preserves existing interactive cards", () => {
    for (const motif of ["check", "trend"] as const) {
      const html = renderToStaticMarkup(
        <StatisticCard label="Metric" value={148} motif={motif} />,
      );
      expect(html).toMatch(/^<div class="stat-card">/);
      expect(html).toContain('class="stat-motif"');
      expect(html).not.toContain("aria-haspopup");
    }
    const interactive = renderToStaticMarkup(
      <StatisticCard
        label="Metric"
        value={148}
        motif="check"
        onClick={() => {}}
      />,
    );
    expect(interactive).toMatch(
      /^<button type="button" class="stat-card" aria-haspopup="dialog"/,
    );
    const css = readFileSync(
      new URL("./vocabulary.css", import.meta.url),
      "utf8",
    );
    expect(css).toMatch(
      /\.vocabulary-stats \.stat-card \{[^}]*align-items: center;[^}]*text-align: center;/,
    );
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).not.toMatch(
      /(?:^|\n)(?:body|:root|\.sidebar|\.workspace-header)\b/,
    );
  });
  it("exposes independent labeled checkboxes and an Inspect Words action for each preset", () => {
    for (const preset of demoVocabulary.presets) {
      for (const selected of [true, false]) {
        const html = renderToStaticMarkup(
          <VocabularyPresetCard
            preset={preset}
            selected={selected}
            onSelect={() => {}}
            onInspect={() => {}}
          />,
        );
        expect(html).toContain('data-selected="' + selected + '"');
        expect(html.includes('checked=""')).toBe(selected);
        expect(html).toContain('name="vocabulary-preset"');
        expect(html).toContain('for="vocabulary-preset-' + preset.id + '"');
        expect(html).toContain('aria-haspopup="dialog"');
        expect(html).toContain("Inspect Words");
      }
    }
    const multiple = renderToStaticMarkup(
      <fieldset>
        {demoVocabulary.presets.slice(0, 2).map((preset) => (
          <VocabularyPresetCard
            key={preset.id}
            preset={preset}
            selected
            onSelect={() => {}}
            onInspect={() => {}}
          />
        ))}
      </fieldset>,
    );
    expect(multiple.match(/type="checkbox"/g)).toHaveLength(2);
    expect(multiple.match(/checked=""/g)).toHaveLength(2);
  });
  it("adds Vocabulary under Practice while retaining existing active destinations", () => {
    for (const pathname of [
      "/",
      "/practice",
      "/mock-tests",
      "/leaderboard",
      "/vocabulary",
    ]) {
      route.pathname = pathname;
      const html = renderToStaticMarkup(
        <Sidebar profile={demoQuestionBank.profile} />,
      );
      const active =
        html.match(/<a[^>]*class="nav-item is-active"[^>]*>/g) ?? [];
      expect(active).toHaveLength(1);
      expect(active[0]).toContain(
        'href="' + (pathname === "/practice" ? "/" : pathname) + '"',
      );
      expect(html).toContain('href="/vocabulary"');
      expect(html.indexOf('title="Mock Tests"')).toBeLessThan(
        html.indexOf('title="Vocabulary"'),
      );
      expect(html.indexOf('title="Vocabulary"')).toBeLessThan(
        html.indexOf('title="Leaderboard"'),
      );
    }
    route.pathname = "/vocabulary";
  });
});
