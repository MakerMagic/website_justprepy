import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoQuestionBank } from "../questions/question-bank.fixtures";
import {
  cropGeometry,
  initials,
  NICKNAME_INTERVAL,
  nicknameError,
  nicknameLocked,
  prepareProfileSave,
  profileTitles,
  settingsDirty,
  validDemoSettings,
  type SavedDemoSettings,
} from "./settings.logic";
import { readDemoProfile, saveDemoProfile } from "./settings-profile";
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "settings-test-font" }),
}));
import { SettingsPage } from "./settings-page";
const defaults = (): SavedDemoSettings => ({
  version: 1,
  nickname: demoQuestionBank.profile.name,
  title: null,
  avatar: null,
  nicknameChangedAt: null,
});
function storage() {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
  } satisfies Storage;
}
describe("Settings profile state", () => {
  it("loads the existing demo profile, without inventing an email or subscription record", () => {
    expect(readDemoProfile(null, demoQuestionBank.profile.name)).toEqual(
      defaults(),
    );
    expect(readDemoProfile("{", demoQuestionBank.profile.name)).toEqual(
      defaults(),
    );
  });
  for (const [name, error] of [
    ["aa", "Use 3–24 characters."],
    ["a".repeat(25), "Use 3–24 characters."],
    ["<script>", "Use letters, numbers, spaces, dots, dashes or underscores."],
    ["Дария_23", ""],
    ["Alex.B - 4", ""],
  ] as const)
    it("validates " + name, () => expect(nicknameError(name)).toBe(error));
  it("uses the first two nickname letters for avatar initials", () => {
    expect(initials(" MakerMagicNow ")).toBe("MA");
    expect(initials("Яна")).toBe("ЯН");
    expect(initials("")).toBe("··");
  });
  it("locks for exactly seven days after a committed nickname change", () => {
    const saved = prepareProfileSave(
      defaults(),
      { ...defaults(), nickname: "NewName" },
      1000,
    );
    expect(nicknameLocked(saved, 1000 + NICKNAME_INTERVAL - 1)).toBe(true);
    expect(nicknameLocked(saved, 1000 + NICKNAME_INTERVAL)).toBe(false);
    expect(() =>
      prepareProfileSave(saved, { ...saved, nickname: "Another" }, 2000),
    ).toThrow("once every 7 days");
    expect(
      prepareProfileSave(saved, { ...saved, title: "math" }, 2000)
        .nicknameChangedAt,
    ).toBe(1000);
    expect(
      prepareProfileSave(
        saved,
        { ...saved, nickname: "Another" },
        1000 + NICKNAME_INTERVAL,
      ).nicknameChangedAt,
    ).toBe(1000 + NICKNAME_INTERVAL);
  });
  it("does not restart the lock on whitespace-only changes, title/avatar saves or rereads", () => {
    const saved = prepareProfileSave(
      defaults(),
      { ...defaults(), nickname: " " + defaults().nickname + " " },
      1000,
    );
    expect(saved.nicknameChangedAt).toBeNull();
    expect(
      readDemoProfile(JSON.stringify(saved), "other").nicknameChangedAt,
    ).toBeNull();
  });
  it("persists valid changes and enforces a newer nickname lock from another tab", () => {
    const db = storage();
    const first = saveDemoProfile(
      "demo",
      { ...defaults(), nickname: "FirstName" },
      1000,
      db,
    );
    expect(first.nicknameChangedAt).toBe(1000);
    expect(() =>
      saveDemoProfile(
        "demo",
        { ...defaults(), nickname: "SecondName" },
        2000,
        db,
      ),
    ).toThrow("once every 7 days");
    expect(db.getItem(db.key(0)!)).toBe(JSON.stringify(first));
  });
  it("propagates persistence failures without claiming or committing success", () => {
    const db = storage();
    db.setItem = () => {
      throw Error("Storage full");
    };
    expect(() => saveDemoProfile("demo", defaults(), 1000, db)).toThrow(
      "Storage full",
    );
    expect(db.length).toBe(0);
  });
  it("keeps selected titles/avatars independent of the saved baseline until Save", () => {
    const saved = defaults(),
      draft = { ...saved, title: "limit" as const };
    expect(settingsDirty(saved, draft)).toBe(true);
    expect(saved.title).toBeNull();
    expect(settingsDirty(saved, { ...saved })).toBe(false);
    expect(profileTitles).toHaveLength(8);
  });
  for (const bad of [
    null,
    {},
    { ...defaults(), avatar: "javascript:alert(1)" },
    { ...defaults(), avatar: "data:image/svg+xml,<svg/>" },
    { ...defaults(), title: "unknown" },
    { ...defaults(), nicknameChangedAt: -1 },
    { ...defaults(), version: 2 },
  ])
    it(
      "rejects invalid/untrusted browser profile " +
        JSON.stringify(bad).slice(0, 60),
      () => expect(validDemoSettings(bad)).toBe(false),
    );
});
describe("Avatar crop bounds", () => {
  for (const [w, h] of [
    [1200, 400],
    [400, 1200],
    [600, 600],
  ])
    for (const z of [1, 2, 3])
      it(`covers the circular crop ${w}x${h} zoom ${z}`, () => {
        const g = cropGeometry(w, h, z, 10000, -10000);
        expect(w * g.scale).toBeGreaterThanOrEqual(244);
        expect(h * g.scale).toBeGreaterThanOrEqual(244);
        expect(Math.abs(g.x)).toBeLessThanOrEqual(
          (w * g.scale - 244) / 2 + 0.0001,
        );
        expect(Math.abs(g.y)).toBeLessThanOrEqual(
          (h * g.scale - 244) / 2 + 0.0001,
        );
        expect(122 + g.x - (w * g.scale) / 2).toBeLessThanOrEqual(0.0001);
        expect(122 + g.y - (h * g.scale) / 2).toBeLessThanOrEqual(0.0001);
      });
});
describe("Standalone Settings integration", () => {
  it("renders the supplied sections, title variants, cropping and confirmation interfaces without shared navigation", () => {
    const html = renderToStaticMarkup(
      <SettingsPage profile={demoQuestionBank.profile} />,
    );
    for (const text of [
      "Settings",
      "Profile",
      "Subscription",
      "Delete Account",
      "Time Remaining",
      "Subscription Renews",
      "Eligible for Refund",
      "Adjust your avatar",
      "Type DELETE to confirm",
      "10,000",
    ])
      expect(html).toContain(text);
    expect(html).toContain('class="back" href="/"');
    expect(html).toContain(">Practice</a>");
    expect(html).toContain('id="settings-email"');
    expect(html).toMatch(/id="settings-email"[^>]*readOnly=""/);
    expect(html).not.toContain("alex.k@example.com");
    expect(html).not.toContain("NUET Preparation");
    expect(html).not.toContain("<aside");
    expect(html).not.toContain("<header");
    expect(html).not.toContain("<footer");
    expect(html).not.toContain("Demo controls");
    expect(html).not.toContain("Cancellation scheduled");
    expect(html).toContain("Billing records are not connected");
  });
});
