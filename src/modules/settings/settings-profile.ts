"use client";
import { useSyncExternalStore } from "react";
import {
  prepareProfileSave,
  validDemoSettings,
  type SavedDemoSettings,
  type ProfileSettings,
} from "./settings.logic";
const eventName = "justprepy-demo-profile-saved";
const keyFor = (account: string) =>
  "justprepy:demo-profile:v1:" + encodeURIComponent(account);
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
function snapshot(account: string) {
  try {
    return localStorage.getItem(keyFor(account));
  } catch {
    return null;
  }
}
export function useDemoProfile(account: string) {
  const raw = useSyncExternalStore(
    subscribe,
    () => snapshot(account),
    () => null,
  );
  return readDemoProfile(raw, account);
}
export function readDemoProfile(
  raw: string | null,
  account: string,
): SavedDemoSettings {
  try {
    const parsed: unknown = JSON.parse(raw ?? "null");
    if (validDemoSettings(parsed)) return parsed;
  } catch {
    /* Untrusted demo browser data is never an authenticated profile. */
  }
  return {
    version: 1,
    nickname: account,
    title: null,
    avatar: null,
    nicknameChangedAt: null,
  };
}
export function saveDemoProfile(
  account: string,
  draft: ProfileSettings,
  now: number,
  storage: Storage = localStorage,
) {
  // Read again to enforce the latest seven-day timestamp, including another tab's save.
  const saved = readDemoProfile(storage.getItem(keyFor(account)), account);
  const next = prepareProfileSave(saved, draft, now);
  storage.setItem(keyFor(account), JSON.stringify(next));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(eventName));
  return next;
}
