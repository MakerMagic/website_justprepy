import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { ContactPage } from "./contact-page";
import { contactChannels, contactNotices } from "./contact.config";
import { Sidebar } from "../questions/sidebar";
import { demoQuestionBank } from "../questions/question-bank.fixtures";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("public contact page", () => {
  it("renders the reference public header, three contact cards and complete footer without extra artwork", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    expect(html).toContain("Contact the Developers");
    expect(html.match(/<article\b/g)).toHaveLength(3);
    for (const label of [
      "Practice",
      "Features",
      "Contact Us",
      "Subscribe",
      "Log In",
      "Direct Developer Support",
      "Direct Email",
      "Telegram Channel",
      "TikTok Community",
      "Offers",
      "Info",
      "Legal",
    ])
      expect(html).toContain(label);
    expect(html).not.toContain("In development phase");
    expect(html).not.toContain("contact-development");
    expect(html).toContain(
      "Not affiliated with, endorsed by, or sponsored by Nazarbayev University",
    );
    expect(html).not.toContain('class="sidebar"');
    expect(html).not.toContain("contact-message");
    expect(html).not.toContain("<form");
    expect(html.match(/<img\b/g)).toHaveLength(2);
    expect(decodeURIComponent(html)).toContain(
      "/brand/justprepy-logo-transparent.png",
    );
  });

  it("wires only the confirmed email and official social destinations", () => {
    expect(contactChannels.map(({ href }) => href)).toEqual([
      "mailto:buildsierem@gmail.com",
      "https://t.me/justprepy",
      "https://www.tiktok.com/@justprepy_",
    ]);
    const html = renderToStaticMarkup(<ContactPage />);
    for (const channel of contactChannels) {
      expect(html).toContain(`href="${channel.href}"`);
      expect(html).toContain(channel.action);
    }
    expect(
      html.match(/target="_blank" rel="noopener noreferrer"/g),
    ).toHaveLength(4);
  });

  it("uses existing routes and exposes unimplemented public destinations as preview actions", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    for (const href of [
      "/",
      "/contact",
      "/login",
      "/mock-tests",
      "/what-is-nuet",
      "/earn",
      "/subscription",
    ])
      expect(html).toContain(`href="${href}"`);
    expect(html).toMatch(/<a[^>]*href="\/subscription"[^>]*>Subscribe<\/a>/);
    expect(html).toMatch(/<a[^>]*href="\/subscription"[^>]*>Subscription<\/a>/);
    for (const label of ["Features", "Privacy Policy", "Terms of service"])
      expect(html).toMatch(new RegExp(`<button[^>]*>${label}<\\/button>`));
    for (const notice of Object.values(contactNotices))
      expect(notice.text).toMatch(/not available|not been published/);
    const sidebar = renderToStaticMarkup(
      <Sidebar profile={demoQuestionBank.profile} />,
    );
    expect(sidebar).toMatch(
      /<a(?=[^>]*href="\/contact")(?=[^>]*title="Contact us")[^>]*>/,
    );
  });

  it("orders Log In before Subscribe and reuses the confirmed social URLs under the footer brand", () => {
    const html = renderToStaticMarkup(<ContactPage />);
    const header = html.split("<header")[1].split("</header>")[0];
    expect(header.indexOf("Log In")).toBeLessThan(header.indexOf("Subscribe"));
    expect(header).toMatch(
      /<a(?=[^>]*href="\/login")(?=[^>]*class="button primary")[^>]*>Log In<\/a>/,
    );
    const socials = html
      .split('class="contact-footer-socials"')[1]
      .split("</div>")[0];
    expect(socials.match(/<a\b/g)).toHaveLength(2);
    expect(socials).toContain('aria-label="JustPrepy on Telegram"');
    expect(socials).toContain('href="https://t.me/justprepy"');
    expect(socials).toContain('aria-label="JustPrepy on TikTok"');
    expect(socials).toContain('href="https://www.tiktok.com/@justprepy_"');
  });

  it("ships the reusable logo as an RGBA PNG with clean transparent bounds", () => {
    const png = readFileSync(
      new URL(
        "../../../public/brand/justprepy-logo-transparent.png",
        import.meta.url,
      ),
    );
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect(png.readUInt32BE(16)).toBe(351);
    expect(png.readUInt32BE(20)).toBe(90);
    expect(png[25]).toBe(6);
  });
});
