/** Source-matched frontend settings. No identity, billing or private account data is stored here. */
export const NICKNAME_INTERVAL = 7 * 864e5;
export const profileTitles = [
  { id: "rising", text: "Rising Scholar", className: "t-plain" },
  { id: "critical", text: "Critical Thinker", className: "t-green" },
  { id: "ace", text: "Academic Ace", className: "t-bold" },
  { id: "math", text: "Math Wizard", emoji: "🧠", className: "t-blue" },
  { id: "innov", text: "Future Innovator", emoji: "✨", className: "t-g1" },
  { id: "strat", text: "The Strategist", className: "t-mono" },
  { id: "top", text: "Top Performer", emoji: "🏆", className: "t-g2" },
  { id: "limit", text: "Limitless", className: "t-g3" },
] as const;
export type TitleId = (typeof profileTitles)[number]["id"];
export interface ProfileSettings {
  nickname: string;
  title: TitleId | null;
  avatar: string | null;
  nicknameChangedAt: number | null;
}
export interface SavedDemoSettings extends ProfileSettings {
  version: 1;
}
export const initials = (name: string) =>
  [...name.trim()].slice(0, 2).join("").toUpperCase() || "··";
export function nicknameError(value: string) {
  const name = value.trim();
  if (name.length < 3 || name.length > 24) return "Use 3–24 characters.";
  return /^[\p{L}\p{N}_. -]+$/u.test(name)
    ? ""
    : "Use letters, numbers, spaces, dots, dashes or underscores.";
}
export function nicknameLocked(settings: ProfileSettings, now: number) {
  return (
    settings.nicknameChangedAt !== null &&
    settings.nicknameChangedAt + NICKNAME_INTERVAL > now
  );
}
export function settingsDirty(saved: ProfileSettings, draft: ProfileSettings) {
  return (
    saved.nickname !== draft.nickname ||
    saved.title !== draft.title ||
    saved.avatar !== draft.avatar
  );
}
export function validDemoSettings(value: unknown): value is SavedDemoSettings {
  if (!value || typeof value !== "object") return false;
  const data = value as SavedDemoSettings;
  return (
    data.version === 1 &&
    typeof data.nickname === "string" &&
    !nicknameError(data.nickname) &&
    data.nickname === data.nickname.trim() &&
    (data.title === null || profileTitles.some((t) => t.id === data.title)) &&
    (data.avatar === null ||
      (typeof data.avatar === "string" &&
        data.avatar.length <= 1000000 &&
        /^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(data.avatar))) &&
    (data.nicknameChangedAt === null ||
      (Number.isFinite(data.nicknameChangedAt) && data.nicknameChangedAt > 0))
  );
}
/** Enforce the saved timestamp again on commit, including drafts opened before the lock changed. */
export function prepareProfileSave(
  saved: ProfileSettings,
  draft: ProfileSettings,
  now: number,
): SavedDemoSettings {
  const nickname = draft.nickname.trim();
  if (nicknameError(nickname)) throw Error(nicknameError(nickname));
  if (nickname !== saved.nickname && nicknameLocked(saved, now))
    throw Error("You can change your nickname once every 7 days.");
  const result: SavedDemoSettings = {
    ...draft,
    version: 1,
    nickname,
    nicknameChangedAt:
      nickname !== saved.nickname ? now : saved.nicknameChangedAt,
  };
  if (!validDemoSettings(result))
    throw Error("These profile settings could not be saved.");
  return result;
}
export function cropGeometry(
  width: number,
  height: number,
  zoom: number,
  offsetX: number,
  offsetY: number,
) {
  const diameter = 244,
    scale =
      Math.max(diameter / width, diameter / height) *
      Math.max(1, Math.min(3, zoom));
  const maxX = Math.max(0, (width * scale - diameter) / 2),
    maxY = Math.max(0, (height * scale - diameter) / 2);
  return {
    scale,
    x: Math.max(-maxX, Math.min(maxX, offsetX)),
    y: Math.max(-maxY, Math.min(maxY, offsetY)),
  };
}
