"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { Icon } from "./icon";
import "./save-question-button.css";

const questionLabels = {
  save: "Save question",
  remove: "Remove saved question",
  saveError: "Could not save question.",
  removeError: "Could not remove saved question.",
};

/** One bookmark control for the solving toolbar and the question review. */
export function SaveQuestionButton({
  saved,
  pending = false,
  disabled = false,
  onToggle,
  labels = questionLabels,
}: {
  saved: boolean;
  labels?: typeof questionLabels;
  pending?: boolean;
  disabled?: boolean;
  onToggle: () => boolean | void | Promise<boolean | void>;
}) {
  const surface = useRef<HTMLSpanElement>(null);
  const player = useRef<AnimationItem | null>(null);
  const currentSaved = useRef(saved);
  const reduced = useRef(true);
  const playWhenReady = useRef(false);
  const playing = useRef(false);
  const busy = useRef(false);
  const mounted = useRef(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const label = saved ? labels.remove : labels.save;

  useEffect(() => {
    currentSaved.current = saved;
    if (!busy.current && (!saved || !playing.current)) {
      playWhenReady.current = false;
      player.current?.goToAndStop(saved ? 49 : 0, true);
    }
  }, [saved]);

  useEffect(() => {
    mounted.current = true;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    const motionChanged = () => {
      reduced.current = media.matches;
      if (media.matches) {
        playing.current = false;
        playWhenReady.current = false;
        player.current?.goToAndStop(currentSaved.current ? 49 : 0, true);
      }
    };
    media.addEventListener("change", motionChanged);
    const abort = new AbortController();
    let disposed = false;
    let animation: AnimationItem | undefined;
    async function load() {
      try {
        const [module, response] = await Promise.all([
          import("lottie-web"),
          fetch("/animations/bookmark.json", { signal: abort.signal }),
        ]);
        if (!response.ok) throw new Error("Bookmark animation unavailable");
        const animationData = await response.json();
        if (disposed || !surface.current) return;
        animation = module.default.loadAnimation({
          container: surface.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData,
        });
        const loaded = () => {
          if (disposed || !animation || player.current === animation) return;
          player.current = animation;
          setReady(true);
          if (playWhenReady.current && !reduced.current) {
            playWhenReady.current = false;
            animation.goToAndPlay(0, true);
          } else {
            animation.goToAndStop(currentSaved.current ? 49 : 0, true);
          }
        };
        animation.addEventListener("DOMLoaded", loaded);
        animation.addEventListener("complete", () => {
          playing.current = false;
          animation?.goToAndStop(currentSaved.current ? 49 : 0, true);
        });
        if (animation.isLoaded) loaded();
      } catch {
        // Keep the native bookmark fallback if the animation cannot load.
      }
    }
    void load();
    return () => {
      disposed = true;
      mounted.current = false;
      abort.abort();
      media.removeEventListener("change", motionChanged);
      animation?.destroy();
      player.current = null;
    };
  }, []);

  async function toggle() {
    if (busy.current || pending || disabled) return;
    busy.current = true;
    setWorking(true);
    setError("");
    const next = !saved;
    try {
      const result = await onToggle();
      if (!mounted.current) return;
      const committed = typeof result === "boolean" ? result : next;
      currentSaved.current = committed;
      if (committed && !reduced.current) {
        playing.current = true;
        if (player.current) player.current.goToAndPlay(0, true);
        else playWhenReady.current = true;
      } else {
        playing.current = false;
        playWhenReady.current = false;
        player.current?.goToAndStop(committed ? 49 : 0, true);
      }
    } catch {
      if (mounted.current)
        setError(saved ? labels.removeError : labels.saveError);
    } finally {
      busy.current = false;
      if (mounted.current) setWorking(false);
    }
  }
  return (
    <button
      type="button"
      className="save-question icon-button"
      aria-label={label}
      aria-pressed={saved}
      aria-busy={pending || working}
      disabled={disabled || pending || working}
      title={label}
      onClick={toggle}
    >
      <span className="bookmark-animation" ref={surface} aria-hidden="true" />
      {!ready && (
        <span className="bookmark-fallback" aria-hidden="true">
          <Icon name="bookmark" size={18} />
        </span>
      )}
      <span className="sr-only" role="status" aria-live="polite">
        {error}
      </span>
    </button>
  );
}
