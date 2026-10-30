"use client";
import Link from "next/link";
import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ProfileTitle } from "./profile-title";
import { AvatarCropper } from "./avatar-cropper";
import { SettingsDialog } from "./settings-dialog";
import {
  initials,
  nicknameError,
  nicknameLocked,
  NICKNAME_INTERVAL,
  profileTitles,
  settingsDirty,
  type ProfileSettings,
  type TitleId,
} from "./settings.logic";
import { saveDemoProfile, useDemoProfile } from "./settings-profile";
import "./settings.css";
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-settings",
});
const freeFeatures = [
  "Limited Mock Tests",
  "Limited Questions",
  "Constrained Vocabulary Practice",
  "Basic Analytics",
];
const proFeatures = [
  "1500+ Questions",
  "All Explanations Available",
  "Unlimited Mock Tests",
  "500+ Vocabulary Words",
  "Advanced Performance Analytics for You",
];
const formatDate = (time: number) =>
  new Date(time).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
function Check() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
function TitlePicker({
  value,
  onChange,
}: {
  value: TitleId | null;
  onChange: (id: TitleId) => void;
}) {
  const [open, setOpen] = useState(false);
  const field = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    (
      list.current?.querySelector<HTMLButtonElement>(
        '[aria-selected="true"]',
      ) ?? list.current?.querySelector<HTMLButtonElement>("button")
    )?.focus();
    const outside = (e: PointerEvent) => {
      if (e.target instanceof Node && !field.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  function key(e: KeyboardEvent<HTMLDivElement>) {
    const buttons = [
        ...list.current!.querySelectorAll<HTMLButtonElement>("button"),
      ],
      index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const target: Record<string, number> = {
      ArrowDown: Math.min(buttons.length - 1, index + 1),
      ArrowUp: Math.max(0, index - 1),
      Home: 0,
      End: buttons.length - 1,
    };
    if (e.key in target) {
      e.preventDefault();
      buttons[target[e.key]]?.focus();
    } else if (e.key === "Escape") {
      e.stopPropagation();
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "Tab") setOpen(false);
  }
  return (
    <div className="fw" ref={field}>
      <button
        className="tf"
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby="profile-title-label selected-title"
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id="selected-title">
          {value ? <ProfileTitle id={value} /> : "Select a title"}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        className={"tp" + (open ? " open" : "")}
        role="listbox"
        aria-labelledby="profile-title-label"
        ref={list}
        onKeyDown={key}
        inert={!open}
      >
        {profileTitles.map((title) => (
          <button
            className="to"
            type="button"
            role="option"
            key={title.id}
            aria-selected={value === title.id}
            onClick={() => {
              onChange(title.id);
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            <span>
              <ProfileTitle id={title.id} />
            </span>
            <span className="ck">
              <Check />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
export function SettingsPage({
  profile,
}: {
  profile: { name: string; initials: string; plan: string };
}) {
  const saved = useDemoProfile(profile.name),
    [pending, setPending] = useState<ProfileSettings | null>(null);
  const draft = pending ?? saved;
  const [now, setNow] = useState<number | null>(null),
    [modal, setModal] = useState<
      "subscription" | "delete" | "terms" | "privacy" | null
    >(null),
    [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    void Promise.resolve().then(() => setNow(Date.now()));
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      clearInterval(timer);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);
  function toast(text: string) {
    setMessage(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setMessage(""), 2600);
  }
  const locked = now !== null && nicknameLocked(saved, now),
    error =
      !locked && draft.nickname !== saved.nickname
        ? nicknameError(draft.nickname)
        : "",
    dirty = settingsDirty(saved, draft);
  function update(next: Partial<ProfileSettings>) {
    setPending({ ...draft, ...next });
  }
  function save() {
    if (!dirty || error) return;
    try {
      saveDemoProfile(profile.name, draft, Date.now());
      setPending(null);
      toast("Demo settings saved in this browser.");
    } catch (reason) {
      toast(
        reason instanceof Error &&
          reason.message === "You can change your nickname once every 7 days."
          ? reason.message
          : "Could not save your settings. Nothing was changed.",
      );
    }
  }
  const pro = profile.plan.toLowerCase() === "pro";
  return (
    <div className={`settings-page ${inter.variable}`}>
      <main className="pg">
        <Link className="back" href="/">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          Practice
        </Link>
        <h1>Settings</h1>
        <section aria-labelledby="settings-profile-heading">
          <h2 id="settings-profile-heading">Profile</h2>
          <div className="pn">
            <p className="hp settings-preview-note">
              Demo profile. Changes are saved only in this browser.
              Authentication and account services are not connected.
            </p>
            <div className="avrow">
              <div
                className="av"
                role="img"
                aria-label={
                  draft.avatar
                    ? "Your avatar"
                    : "Avatar with initials " +
                      initials(draft.nickname || saved.nickname)
                }
              >
                {draft.avatar ? (
                  <Image
                    src={draft.avatar}
                    alt=""
                    width={96}
                    height={96}
                    unoptimized
                  />
                ) : (
                  initials(draft.nickname || saved.nickname)
                )}
              </div>
              <div className="avc">
                <AvatarCropper
                  onApply={(avatar) => update({ avatar })}
                  onError={toast}
                />
                {draft.avatar && (
                  <button
                    className="lnk"
                    type="button"
                    onClick={() => update({ avatar: null })}
                  >
                    Remove Avatar
                  </button>
                )}
                {draft.avatar !== saved.avatar && (
                  <span className="pend">Unsaved</span>
                )}
              </div>
            </div>
            <div className="fd">
              <label className="lb" htmlFor="settings-nickname">
                Nickname{" "}
                {draft.nickname !== saved.nickname && (
                  <span className="pend">Unsaved</span>
                )}
              </label>
              <input
                className="in"
                id="settings-nickname"
                autoComplete="off"
                maxLength={24}
                value={locked ? saved.nickname : draft.nickname}
                disabled={locked || now === null}
                aria-invalid={!!error}
                aria-describedby="nickname-help"
                onChange={(e) => update({ nickname: e.target.value })}
              />
              <p className={"hp" + (error ? " er" : "")} id="nickname-help">
                {error ||
                  (locked
                    ? `You can change your nickname once every 7 days. Next change available on ${formatDate(saved.nicknameChangedAt! + NICKNAME_INTERVAL)}.`
                    : "You can change your nickname once every 7 days.")}
              </p>
            </div>
            <div className="fd">
              <label className="lb" htmlFor="settings-email">
                Email
              </label>
              <div className="iw">
                <input
                  className="in"
                  id="settings-email"
                  value=""
                  placeholder="Registered email unavailable"
                  readOnly
                  aria-describedby="email-help"
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
              <p className="hp" id="email-help">
                This email is associated with your account and cannot be changed
                here. Registration data is not connected.
              </p>
            </div>
            <div className="fd">
              <span className="lb" id="profile-title-label">
                Profile Title{" "}
                {draft.title !== saved.title && (
                  <span className="pend">Unsaved</span>
                )}
              </span>
              <TitlePicker
                value={draft.title}
                onChange={(title) => update({ title })}
              />
            </div>
          </div>
        </section>
        <section aria-labelledby="settings-subscription-heading">
          <h2 id="settings-subscription-heading">Subscription</h2>
          <div className="sub">
            <div className={"pc " + (pro ? "pro" : "free")}>
              <h3>{pro ? "Pro" : "Free"}</h3>
              <div className="pr">
                {pro ? "10,000" : "0"}
                <span>₸</span>
              </div>
              <ul>
                {(pro ? proFeatures : freeFeatures).map((feature) => (
                  <li key={feature}>
                    {pro && (
                      <span className="ci">
                        <Check />
                      </span>
                    )}
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="cu">Currently using</div>
            </div>
            <div className="sc2">
              <h3>Subscription Status</h3>
              <div className="tl">
                <small>Time Remaining</small>
                <div className="tv">
                  <b>—</b>
                </div>
              </div>
              {pro ? (
                <>
                  <dl className="ro">
                    <div>
                      <dt>Subscription Renews</dt>
                      <dd>Unavailable</dd>
                    </div>
                    <div>
                      <dt>Eligible for Refund</dt>
                      <dd>Unavailable</dd>
                    </div>
                  </dl>
                  <button
                    className="btn o cb"
                    type="button"
                    onClick={() => setModal("subscription")}
                  >
                    Cancel Subscription
                  </button>
                </>
              ) : (
                <div className="nt">No paid subscription is active.</div>
              )}
              <p className="nt">
                Demo plan from the existing profile. Billing records are not
                connected.
              </p>
            </div>
          </div>
        </section>
        <section aria-labelledby="settings-delete-heading">
          <div className="dz">
            <div>
              <h2 id="settings-delete-heading">Delete Account</h2>
              <p>
                Permanently remove your account and its data. This is separate
                from the settings above.
              </p>
            </div>
            <button
              className="btn o"
              type="button"
              onClick={() => {
                setConfirmation("");
                setModal("delete");
              }}
            >
              Delete Account
            </button>
          </div>
        </section>
        <nav className="legal" aria-label="Legal">
          <a
            href="#terms"
            onClick={(e) => {
              e.preventDefault();
              setModal("terms");
            }}
          >
            Terms of Service
          </a>
          <a
            href="#privacy"
            onClick={(e) => {
              e.preventDefault();
              setModal("privacy");
            }}
          >
            Privacy Policy
          </a>
        </nav>
      </main>
      <div className="bar" role="region" aria-label="Save changes">
        <div>
          <span className={dirty ? "d" : ""}>
            {dirty ? "You have unsaved changes" : "All changes saved"}
          </span>
          <span className="acts">
            <button
              className="btn"
              type="button"
              onClick={() => {
                setPending(null);
                window.scrollTo({
                  top: 0,
                  behavior: matchMedia("(prefers-reduced-motion:reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              Cancel
            </button>
            <button
              className="btn p"
              type="button"
              disabled={!dirty || !!error}
              onClick={save}
            >
              Save
            </button>
          </span>
        </div>
      </div>
      <div
        id="settings-toast"
        className={message ? "on" : ""}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
      <SettingsDialog
        open={modal === "subscription"}
        onClose={() => setModal(null)}
        titleId="subscription-cancel-title"
      >
        <h2 id="subscription-cancel-title">Cancel your Pro subscription?</h2>
        <p>
          Subscription renewal and access dates are unavailable. Billing is not
          connected; no cancellation can be scheduled here.
        </p>
        <div className="acts">
          <button
            className="btn p"
            type="button"
            onClick={() => setModal(null)}
          >
            Keep Subscription
          </button>
          <button
            className="btn d"
            type="button"
            onClick={() => {
              setModal(null);
              toast(
                "Subscription cancellation is unavailable. Your plan has not changed.",
              );
            }}
          >
            Cancel Subscription
          </button>
        </div>
      </SettingsDialog>
      <SettingsDialog
        open={modal === "delete"}
        onClose={() => setModal(null)}
        titleId="account-delete-title"
      >
        <h2 id="account-delete-title">Permanently delete your account?</h2>
        <ul>
          <li>
            Your account will be permanently deleted and you will lose access to
            it.
          </li>
          <li>
            Your profile, progress and saved data may be permanently removed
            according to our deletion policy.
          </li>
          <li>This cannot be undone once deletion is complete.</li>
        </ul>
        <label className="lb" htmlFor="delete-confirmation">
          Type DELETE to confirm
        </label>
        <input
          className="in"
          id="delete-confirmation"
          autoComplete="off"
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
        <p className="hp">
          Prototype: no real account is deleted. Secure account deletion is not
          connected.
        </p>
        <div className="acts">
          <button
            className="btn p"
            type="button"
            onClick={() => setModal(null)}
          >
            Keep My Account
          </button>
          <button
            className="btn d"
            type="button"
            disabled={confirmation.trim() !== "DELETE"}
            onClick={() => {
              setModal(null);
              toast(
                "Account deletion is unavailable. No account or saved data was deleted.",
              );
            }}
          >
            Delete Account Permanently
          </button>
        </div>
      </SettingsDialog>
      <SettingsDialog
        open={modal === "terms" || modal === "privacy"}
        onClose={() => setModal(null)}
        titleId="settings-legal-title"
      >
        <h2 id="settings-legal-title">
          {modal === "privacy" ? "Privacy Policy" : "Terms of Service"}
        </h2>
        <p>This legal page is not available in the current preview.</p>
        <div className="acts">
          <button className="btn" type="button" onClick={() => setModal(null)}>
            Back to Settings
          </button>
        </div>
      </SettingsDialog>
    </div>
  );
}
