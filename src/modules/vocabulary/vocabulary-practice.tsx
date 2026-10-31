"use client";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  VocabularyBookmark,
  VocabularyPracticeSummary,
} from "./vocabulary-practice-summary";
import {
  missedEntries,
  practiceReducer,
  startPractice,
  type PracticeAction,
  type PracticeEntry,
  type PracticeResult,
} from "./vocabulary-practice-state";
import {
  vocabularyWordKey,
  type VocabularyWordState,
} from "./vocabulary-words";
import "./vocabulary-practice.css";

export function VocabularyPractice({
  entries,
  words,
  onSave,
  onExclude,
  onExit,
}: {
  entries: readonly PracticeEntry[];
  words: VocabularyWordState;
  onSave: (entry: PracticeEntry, saved: boolean) => void;
  onExclude: (entry: PracticeEntry) => void;
  onExit: () => void;
}) {
  const [session, setSession] = useState(() => startPractice(entries));
  const currentSession = useRef(session);
  const mainRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const animations = useRef(new Set<Animation>());
  const busy = useRef(false);
  const alive = useRef(true);
  const savedKeys = new Set(
    (words.words["my-words"] ?? []).map((word) =>
      vocabularyWordKey("my-words", word),
    ),
  );
  const current = session.queue[session.pos];

  function commit(action: PracticeAction) {
    const next = practiceReducer(currentSession.current, action);
    currentSession.current = next;
    setSession(next);
    return next;
  }
  useEffect(() => {
    alive.current = true;
    const running = animations.current;
    return () => {
      alive.current = false;
      running.forEach((animation) => animation.cancel());
      running.clear();
    };
  }, []);
  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [session.summary]);

  async function animateSlot(
    frames: Keyframe[],
    options: KeyframeAnimationOptions,
  ) {
    const slot = slotRef.current;
    if (!slot?.animate) return;
    const animation = slot.animate(frames, options);
    animations.current.add(animation);
    await animation.finished;
  }
  async function go(direction: number) {
    const state = currentSession.current,
      pos = state.pos + direction;
    if (busy.current || state.summary || pos < 0 || pos >= state.queue.length)
      return;
    busy.current = true;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    try {
      if (!reduceMotion)
        await animateSlot(
          [
            { opacity: 1, transform: "translateX(0)" },
            { opacity: 0, transform: "translateX(" + -direction * 28 + "px)" },
          ],
          { duration: 150, easing: "ease-in", fill: "forwards" },
        );
      if (!alive.current) return;
      const card = cardRef.current;
      if (card) card.style.transition = "none";
      flushSync(() => commit({ type: "move", direction }));
      if (card) {
        void card.offsetWidth;
        card.style.transition = "";
      }
      if (!reduceMotion)
        await animateSlot(
          [
            { opacity: 0, transform: "translateX(" + direction * 28 + "px)" },
            { opacity: 1, transform: "translateX(0)" },
          ],
          { duration: 230, easing: "cubic-bezier(.2,.8,.2,1)" },
        );
    } catch (error) {
      // Animation cancellation on exit is expected; other failures must stay visible.
      if (
        alive.current &&
        !(error instanceof DOMException && error.name === "AbortError")
      )
        throw error;
    } finally {
      animations.current.forEach((animation) => animation.cancel());
      animations.current.clear();
      busy.current = false;
    }
  }
  function answer(kind: PracticeResult | "never") {
    const state = currentSession.current;
    if (!state.flipped || state.summary || busy.current) return;
    const entry = state.queue[state.pos];
    if (kind === "never") onExclude(entry);
    const next = commit({ type: "answer", kind });
    if (!next.summary) void go(1);
  }
  function finish() {
    if (!busy.current) commit({ type: "finish" });
  }
  function toggleSave(entry: PracticeEntry) {
    onSave(entry, !savedKeys.has(entry.key));
  }
  function saveAll() {
    missedEntries(currentSession.current).forEach((entry) =>
      onSave(entry, true),
    );
  }
  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if (
        currentSession.current.summary ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      const target = event.target;
      if (
        target instanceof Element &&
        target !== document.body &&
        !mainRef.current?.contains(target)
      )
        return;
      if (event.key === "ArrowLeft") void go(-1);
      else if (event.key === "ArrowRight") void go(1);
      else if (event.key === "1") answer("missed");
      else if (event.key === "2") answer("knew");
      else if (
        event.key === " " &&
        !(target instanceof Element && target.closest("button"))
      ) {
        event.preventDefault();
        commit({ type: "flip", value: !currentSession.current.flipped });
      }
    }
    document.addEventListener("keydown", keydown);
    return () => document.removeEventListener("keydown", keydown);
  });

  return (
    <main id="main-content" className="vocabulary-practice-screen" data-ui>
      <div className="vpr-wrap" ref={mainRef} tabIndex={-1}>
        <h1 className="vpr-sr">Vocabulary flashcards</h1>
        {session.summary ? (
          <VocabularyPracticeSummary
            reviewed={Object.keys(session.results).length}
            total={session.queue.length}
            missed={missedEntries(session)}
            savedKeys={savedKeys}
            onToggleSave={toggleSave}
            onSaveAll={saveAll}
            onRedo={() => commit({ type: "redo" })}
            onExit={onExit}
          />
        ) : (
          <section aria-label="Vocabulary practice">
            <div className="vpr-top">
              <div
                className="vpr-bar"
                role="progressbar"
                aria-label="Word progress"
                aria-valuemin={0}
                aria-valuemax={session.queue.length}
                aria-valuenow={session.pos + 1}
              >
                <i
                  style={{
                    transform:
                      "scaleX(" +
                      (session.pos + 1) / session.queue.length +
                      ")",
                  }}
                />
              </div>
              <span className="vpr-count" aria-live="polite">
                {session.pos + 1} / {session.queue.length}
              </span>
            </div>
            <div className="vpr-stage">
              <button
                type="button"
                className="vpr-arrow vpr-prev"
                aria-label="Previous word"
                disabled={session.pos === 0}
                onClick={() => void go(-1)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m15 6-6 6 6 6" />
                </svg>
              </button>
              <div className="vpr-deck">
                <div className="vpr-slot" ref={slotRef}>
                  <div
                    className={
                      "vpr-card" + (session.flipped ? " vpr-flip" : "")
                    }
                    ref={cardRef}
                  >
                    <button
                      type="button"
                      className="vpr-face vpr-front"
                      aria-label="Show meaning"
                      inert={session.flipped}
                      onClick={() => commit({ type: "flip", value: true })}
                    >
                      <span className="vpr-w">{current.word.word}</span>
                    </button>
                    <div
                      className="vpr-face vpr-back"
                      inert={!session.flipped}
                      role="group"
                      aria-label={"Meaning of " + current.word.word}
                      onClick={(event) => {
                        if (!(
                          event.target instanceof Element &&
                          event.target.closest(".vpr-mark")
                        ))
                          commit({ type: "flip", value: false });
                      }}
                    >
                      <div className="vpr-head">
                        <span className="vpr-hw">{current.word.word}</span>
                        <span className="vpr-pos">
                          {current.word.partOfSpeech}
                        </span>
                      </div>
                      <VocabularyBookmark
                        entry={current}
                        saved={savedKeys.has(current.key)}
                        onToggle={toggleSave}
                      />
                      <div className="vpr-body">
                        <div className="vpr-tr">
                          {current.word.practiceMeaning ?? current.word.meaning}
                        </div>
                        <p className="vpr-def">{current.word.definition}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="vpr-arrow vpr-next"
                aria-label="Next word"
                disabled={session.pos === session.queue.length - 1}
                onClick={() => void go(1)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
            <div className="vpr-under">
              <div
                className={"vpr-answers" + (!session.flipped ? " vpr-off" : "")}
                inert={!session.flipped}
              >
                <button
                  type="button"
                  className="vpr-btn"
                  onClick={() => answer("missed")}
                >
                  I did not know it
                </button>
                <button
                  type="button"
                  className="vpr-btn vpr-primary"
                  onClick={() => answer("knew")}
                >
                  I knew it
                </button>
              </div>
              <div className="vpr-foot">
                <button
                  type="button"
                  className={"vpr-ghost" + (!session.flipped ? " vpr-off" : "")}
                  inert={!session.flipped}
                  onClick={() => answer("never")}
                >
                  Never show me this again
                </button>
                <button type="button" className="vpr-btn" onClick={finish}>
                  Finish
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
