import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CreatorsPage } from "./creators-page";
import { Sidebar } from "../questions/sidebar";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { ContactPage } from "../contact/contact-page";
import { NuetPage } from "../nuet/nuet-page";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "reference-font" }),
}));
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

function mainContent(html: string) {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/)![1];
}
function textOnly(html: string) {
  return html
    .replace(/<[^>]+>/g, "")
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replace(/\s+/g, "");
}

describe("Claude creator-program integration", () => {
  it("preserves source content except the approved lowercase branding and removed explanations", () => {
    const main = mainContent(renderToStaticMarkup(<CreatorsPage />));
    expect(createHash("sha256").update(textOnly(main)).digest("hex")).toBe(
      "f5606e9b2568954d9273f32fc76a9f07333c5ebca57a00f5e9efcb698cf76464",
    );
    const headings = [
      "Get paid to make NUET content.",
      "Your code earns. So does your team.",
      "And that’s not all.",
      "Ready to create?",
    ];
    for (let i = 1; i < headings.length; i++)
      expect(main.indexOf(headings[i - 1])).toBeLessThan(
        main.indexOf(headings[i]),
      );
    expect(main.match(/<section\b/g)).toHaveLength(4);
    expect(main.match(/class="[^"]*\brv\b[^"]*"/g)).toHaveLength(7);
    expect(main).not.toMatch(/Just ?Prep(?:y)?/);
  });

  it("reuses one public shell, the official logo, lowercased brand labels and active Earn money link", () => {
    const html = renderToStaticMarkup(<CreatorsPage />);
    expect(html.match(/<header\b/g)).toHaveLength(1);
    expect(html.match(/<footer\b/g)).toHaveLength(1);
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html).toContain('class="contact-header"');
    expect(html).toContain('class="contact-footer"');
    expect(html).toContain(
      encodeURIComponent("/brand/justprepy-logo-transparent.png"),
    );
    expect(html).toContain('alt="justprepy"');
    expect(html).toContain('aria-label="justprepy on Telegram"');
    expect(html).toContain('href="#creators-main"');
    expect(html).toMatch(
      /<a(?=[^>]*href="\/earn")(?=[^>]*aria-current="page")[^>]*>Earn money<\/a>/,
    );
    expect(html).not.toMatch(
      /<a(?=[^>]*href="\/what-is-nuet")(?=[^>]*aria-current="page")/,
    );
    expect(html).not.toContain('class="sidebar"');
    expect(html).not.toMatch(/JustPrepy|Justprepy|Just Prep/);
  });

  it("connects the sidebar and public footer to the same existing-router destination", () => {
    const sidebar = renderToStaticMarkup(
      <Sidebar profile={demoQuestionBank.profile} />,
    );
    expect(sidebar).toMatch(
      /<a(?=[^>]*href="\/earn")(?=[^>]*title="Earn money")[^>]*>/,
    );
    for (const page of [
      <ContactPage key="contact" />,
      <NuetPage key="nuet" />,
      <CreatorsPage key="creators" />,
    ]) {
      const footer = renderToStaticMarkup(page)
        .split("<footer")[1]
        .split("</footer>")[0];
      expect(footer).toMatch(/<a(?=[^>]*href="\/earn")[^>]*>Earn money<\/a>/);
      expect(footer).not.toMatch(/<button[^>]*>Earn money<\/button>/);
    }
  });

  it("keeps the source empty-application fallback and both commission tabs functional in initial markup", () => {
    const main = mainContent(renderToStaticMarkup(<CreatorsPage />));
    expect(main).toContain(
      "Creator applications are not open on this page yet.",
    );
    expect(main).toMatch(
      /<a(?=[^>]*href="#apply")(?=[^>]*data-apply)[^>]*>Apply for Creator Program<\/a>/,
    );
    expect(main).toMatch(
      /<a(?=[^>]*href="https:\/\/t.me\/justprepy")(?=[^>]*target="_blank")(?=[^>]*rel="noopener")[^>]*>Follow on Telegram<\/a>/,
    );
    expect(main).toMatch(
      /<button(?=[^>]*role="tab")(?=[^>]*id="t1")(?=[^>]*aria-selected="true")(?=[^>]*tabindex="0")[^>]*>Your code<\/button>/,
    );
    expect(main).toMatch(
      /<button(?=[^>]*role="tab")(?=[^>]*id="t2")(?=[^>]*aria-selected="false")(?=[^>]*tabindex="-1")[^>]*>Creators you recruit<\/button>/,
    );
    expect(main).toContain('id="n">20%</div>');
    expect(main).not.toContain("KZT");
    expect(main).not.toContain("Not guaranteed. It depends on your results.");
    expect(main).toContain('class="ph rv" aria-hidden="true"');
    expect(main).not.toContain("<form");
  });

  it("retains the source configurable live-application branch without inventing a real application URL", () => {
    const main = mainContent(
      renderToStaticMarkup(
        <CreatorsPage applicationUrl="https://example.invalid/creator-application" />,
      ),
    );
    expect(
      main.match(/href="https:\/\/example.invalid\/creator-application"/g),
    ).toHaveLength(2);
    expect(main).toMatch(/<p(?=[^>]*class="hid")(?=[^>]*data-open)/);
    expect(main).toMatch(/<p data-live/);
    expect(main).toMatch(
      /<a(?=[^>]*data-live)(?=[^>]*class="btn bg big")(?=[^>]*target="_blank")/,
    );
  });

  it("keeps the source phone/reveal/tab motion and responsive rules scoped away from shared chrome", () => {
    const css = readFileSync(
      new URL("./creators.css", import.meta.url),
      "utf8",
    );
    expect(css).toMatch(/\.creators-main \{[^}]*overflow-x: hidden/);
    expect(css).toContain("@keyframes creators-phone-progress");
    expect(css).toMatch(
      /animation:\s*creators-phone-progress 6s linear infinite/,
    );
    expect(css).toMatch(/opacity 0\.6s/);
    expect(css).toMatch(/transform 0\.6s/);
    expect(css).toMatch(/opacity 0\.25s/);
    expect(css).toMatch(/transform 0\.25s/);
    expect(css).toMatch(/translateY\(22px\)/);
    expect(css).toMatch(/translateY\(10px\)/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("@media (max-width: 900px)");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).not.toMatch(/(?:^|\n)(?:header|footer|body|:root|\.contact-)/);
    expect(css).toMatch(/\.creators-main \.scr \.bar b[^}]*animation: none/);
  });
});
