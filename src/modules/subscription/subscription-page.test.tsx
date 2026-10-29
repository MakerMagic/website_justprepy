import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "subscription-font" }),
}));

import { SubscriptionPage } from "./subscription-page";

describe("dedicated subscription page", () => {
  it("shows the unchanged Free and Pro plans between the shared header and footer", () => {
    const html = renderToStaticMarkup(<SubscriptionPage />);
    for (const content of [
      "Choose your plan",
      "Free",
      "Pro",
      "0<span>₸",
      "10,000<span>₸",
      "Limited Mock Tests",
      "Basic Analytics",
      "1500+ Questions",
      "Advanced Performance Analytics for You",
      "Currently using",
    ])
      expect(html).toContain(content);
    expect(html.match(/<li\b/g)).toHaveLength(9);
    expect(html).not.toContain('<dialog class="subscription-overlay');
    expect(html).not.toContain('class="question-bank-app"');
    const order = [
      "<header",
      "subscription-plans",
      "subscription-demo",
      "<footer",
    ].map((marker) => html.indexOf(marker));
    expect(order.every((index) => index >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
  it("keeps the demo call pending and unlinked until a destination is configured", () => {
    const pending = renderToStaticMarkup(<SubscriptionPage />);
    expect(pending).toContain("Not sure yet?");
    expect(pending).toMatch(
      /<a(?![^>]*href=)[^>]*aria-disabled="true"[^>]*>Book a Demo Call<\/a>/,
    );
    expect(pending).toContain("Demo call booking is not open yet.");
    const live = renderToStaticMarkup(
      <SubscriptionPage demoCallUrl="/demo-call" />,
    );
    expect(live).toMatch(
      /<a[^>]*href="\/demo-call"[^>]*>Book a Demo Call<\/a>/,
    );
    expect(live).not.toContain("not open yet");
  });
});
