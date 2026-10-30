"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { Icon } from "../questions/icon";
import { PracticeContentView } from "../questions/practice-content";
import {
  PracticeDialog,
  PracticeDialogClose,
} from "../questions/practice-dialog";
import { navigatorTarget } from "../questions/practice.logic";
import type { MockTest } from "./mock-tests.types";
import {
  activeExamSection,
  changeDemoAttempt,
  createDemoAttempt,
  demoExamQuestions,
  demoResultsHref,
  demoTakeHref,
  elapsedSeconds,
  examSectionNames,
  examSections,
  attemptExpired,
  attemptDeadline,
  type AttemptChange,
  type DemoMockAttempt,
  type ExamQuestion,
} from "./mock-test-attempt.logic";
import {
  readDemoAttempts,
  saveDemoAttempt,
  finalizeDemoAttempt,
} from "./mock-test-attempt.storage";
import {
  observeQuestionTime,
  type QuestionTimingCursor,
} from "./mock-test-timing.logic";
import "../questions/question-bank.css";
import "../questions/question-solver.css";
import "../questions/practice-modals.css";
import "./mock-test-taking.css";

export function FlagIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0" />
    </svg>
  );
}

function buildFlagParticlesAnimationData(source: Record<string, unknown>) {
  const clone = JSON.parse(JSON.stringify(source)) as {
    nm?: string;
    layers?: Array<{ nm?: string }>;
  };
  clone.nm = "flag-particles";
  if (Array.isArray(clone.layers)) {
    clone.layers = clone.layers.filter(
      (layer) => layer.nm !== "bookmark" && layer.nm !== "notFilled",
    );
  }
  return clone;
}

export function FlagQuestionButton({
  flagged,
  onToggle,
  disabled = false,
}: {
  flagged: boolean;
  disabled?: boolean;
  onToggle: () => boolean | void;
}) {
  const surface = useRef<HTMLSpanElement>(null);
  const player = useRef<AnimationItem | null>(null);
  const reduced = useRef(true);
  const playWhenReady = useRef(false);
  const [bursting, setBursting] = useState(false);
  const label = flagged ? "Remove question flag" : "Flag question";

  useEffect(() => {
    if (!flagged) {
      playWhenReady.current = false;
      player.current?.goToAndStop(0, true);
    }
  }, [flagged]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    const motionChanged = () => {
      reduced.current = media.matches;
      if (media.matches) {
        playWhenReady.current = false;
        player.current?.goToAndStop(0, true);
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
        if (!response.ok) throw new Error("Flag animation unavailable");
        const raw = (await response.json()) as Record<string, unknown>;
        if (disposed || !surface.current) return;
        animation = module.default.loadAnimation({
          container: surface.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData: buildFlagParticlesAnimationData(raw),
        });
        const loaded = () => {
          if (disposed || !animation || player.current === animation) return;
          player.current = animation;
          if (playWhenReady.current && !reduced.current) {
            playWhenReady.current = false;
            animation.goToAndPlay(0, true);
          } else {
            animation.goToAndStop(0, true);
          }
        };
        animation.addEventListener("DOMLoaded", loaded);
        animation.addEventListener("complete", () => {
          animation?.goToAndStop(0, true);
        });
        if (animation.isLoaded) loaded();
      } catch {
        // Keep the original SVG flag icon even if particles cannot load.
      }
    }
    void load();
    return () => {
      disposed = true;
      abort.abort();
      media.removeEventListener("change", motionChanged);
      animation?.destroy();
      player.current = null;
    };
  }, []);

  function toggle() {
    const next = !flagged;
    const result = onToggle();
    const committed = typeof result === "boolean" ? result : next;
    if (committed && !reduced.current) {
      setBursting(true);
      if (player.current) player.current.goToAndPlay(0, true);
      else playWhenReady.current = true;
    } else {
      setBursting(false);
      playWhenReady.current = false;
      player.current?.goToAndStop(0, true);
    }
  }

  return (
    <button
      type="button"
      className="save-question icon-button mock-flag"
      disabled={disabled}
      aria-label={label}
      aria-pressed={flagged}
      data-bursting={bursting ? "true" : undefined}
      title={label}
      onClick={toggle}
      onAnimationEnd={() => setBursting(false)}
    >
      <span className="bookmark-animation" ref={surface} aria-hidden="true" />
      <span className="bookmark-fallback" aria-hidden="true">
        <FlagIcon />
      </span>
    </button>
  );
}
function ExamTimer({ seconds }: { seconds: number | null }) {
  return (
    <div
      className="practice-timer"
      role="timer"
      aria-label="Elapsed test time"
      aria-live="off"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      <span>
        Timer<span className="timer-colon">:</span>
      </span>
      <span className="timer-value">
        {seconds === null
          ? "—"
          : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
      </span>
    </div>
  );
}
export function MockQuestionNavigator({
  open,
  onClose,
  questions,
  attempt,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  questions: ExamQuestion[];
  attempt: DemoMockAttempt;
  onNavigate: (id: string) => void;
}) {
  return (
    <PracticeDialog
      open={open}
      onClose={onClose}
      titleId="mock-navigator-title"
      className="navigator-dialog mock-exam-navigator"
      initialFocus='[aria-current="step"]'
    >
      <header className="navigator-header">
        <h2 id="mock-navigator-title">Navigate Questions</h2>
        <PracticeDialogClose onClose={onClose} />
      </header>
      <p className="mock-navigator-section">
        {examSectionNames[questions[0].examSection]}
      </p>
      <div
        className="navigator-grid"
        onKeyDown={(event) => {
          if (!(event.target instanceof HTMLButtonElement)) return;
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button",
            ),
          ];
          const index = navigatorTarget(
            buttons.indexOf(event.target),
            event.key,
            questions.length,
            getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ")
              .length,
          );
          if (index !== null) {
            event.preventDefault();
            buttons[index]?.focus();
          }
        }}
      >
        {questions.map((question) => {
          const answered = !!attempt.answers[question.id];
          const flagged = attempt.flags.includes(question.id);
          return (
            <button
              type="button"
              key={question.id}
              className="navigator-question"
              data-state={answered ? "answered" : "unanswered"}
              aria-current={
                attempt.currentId === question.id ? "step" : undefined
              }
              aria-label={`Question ${question.localNumber}, ${answered ? "answered" : "unanswered"}${flagged ? ", flagged" : ""}${attempt.currentId === question.id ? ", current question" : ""}`}
              onClick={() => onNavigate(question.id)}
            >
              {question.localNumber}
              {flagged && (
                <span className="mock-tile-flag">
                  <FlagIcon />
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="navigator-legend">
        <span>
          <i className="navigator-swatch" data-state="answered" />
          Answered
        </span>
        <span>
          <i className="navigator-swatch" data-state="unanswered" />
          Unanswered
        </span>
        <span className="mock-flag-legend">
          <FlagIcon />
          Flagged
        </span>
      </div>
    </PracticeDialog>
  );
}
export function MockTestTaking({
  test,
  initialAttempt,
}: {
  test: MockTest;
  initialAttempt: DemoMockAttempt;
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(initialAttempt);
  const latest = useRef(attempt);
  const timingCursor = useRef<QuestionTimingCursor | null>(null);
  const [modal, setModal] = useState<
    "navigator" | "finish-section" | "finish" | "exit" | null
  >(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState<number | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const submitting = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const readingArea = useRef<HTMLDivElement>(null);
  const questions = demoExamQuestions(test);
  const sections = examSections(test);
  const activeSection = activeExamSection(attempt, sections);
  const sectionQuestions = questions.filter(
    (q) => q.examSection === activeSection,
  );
  const sectionIndex = Math.max(
    0,
    sectionQuestions.findIndex((q) => q.id === attempt.currentId),
  );
  const question = sectionQuestions[sectionIndex] ?? sectionQuestions[0];
  const isFinalSection =
    sections.indexOf(activeSection) === sections.length - 1;
  const isLastInSection = sectionIndex === sectionQuestions.length - 1;

  function focusQuestionTop() {
    requestAnimationFrame(() => {
      readingArea.current?.scrollTo({ top: 0, behavior: "instant" });
      if (window.matchMedia("(max-width: 899px)").matches)
        window.scrollTo({ top: 0, behavior: "instant" });
      heading.current?.focus({ preventScroll: true });
    });
  }
  function commit(next: DemoMockAttempt) {
    try {
      saveDemoAttempt(next);
      latest.current = next;
      setAttempt(next);
      setError("");
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save this demo attempt. Please retry.",
      );
      return false;
    }
  }
  const recordTime = useCallback(
    (time: number) => {
      try {
        // A timing checkpoint must not overwrite a newer answer, navigation or completion from another view.
        const saved = readDemoAttempts(test).find(
          (row) => row.id === latest.current.id,
        );
        if (!saved) throw Error("Saved attempt unavailable");
        const observed = observeQuestionTime(
          saved,
          timingCursor.current,
          time,
          document.visibilityState !== "hidden",
          attemptDeadline(test, saved),
        );
        if (observed.attempt !== saved) saveDemoAttempt(observed.attempt);
        latest.current = observed.attempt;
        setAttempt(observed.attempt);
        timingCursor.current = observed.cursor;
        return true;
      } catch {
        setError(
          "Could not save question timing. Your existing answers remain saved; please retry.",
        );
        return false;
      }
    },
    [test],
  );
  function change(action: AttemptChange, time: number) {
    if (submitting.current || latest.current.completedAt !== null) return false;
    if (attemptExpired(test, latest.current, time)) {
      void finish(time);
      return false;
    }
    if (!recordTime(time)) return false;
    const next = changeDemoAttempt(latest.current, questions, action);
    if (!commit(next)) return false;
    timingCursor.current = {
      id: next.currentId,
      at: time,
      visible: document.visibilityState !== "hidden",
    };
    return true;
  }
  function navigate(id: string, time: number) {
    if (!change({ kind: "navigate", id }, time)) return;
    setModal(null);
    focusQuestionTop();
  }
  function finishSection(time: number) {
    if (!change({ kind: "finish-section" }, time)) return;
    setModal(null);
    focusQuestionTop();
  }
  const finish = useCallback(
    async (time: number) => {
      if (submitting.current || !recordTime(time)) return;
      submitting.current = true;
      setFinalizing(true);
      try {
        const completed = await finalizeDemoAttempt(test, latest.current, time);
        latest.current = completed;
        setAttempt(completed);
        setModal(null);
        router.replace(demoResultsHref(completed));
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : "Could not submit this attempt. Please retry.",
        );
        submitting.current = false;
        setFinalizing(false);
      }
    },
    [test, router, recordTime],
  );
  useEffect(() => {
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (!submitting.current && latest.current.completedAt === null)
        recordTime(time);
      if (
        latest.current.completedAt !== null ||
        attemptExpired(test, latest.current, time)
      )
        void finish(time);
    };
    void Promise.resolve().then(tick);
    const timer = window.setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    window.addEventListener("storage", tick);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("pagehide", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", tick);
      window.removeEventListener("storage", tick);
      document.removeEventListener("visibilitychange", tick);
      window.removeEventListener("pagehide", tick);
    };
  }, [test, finish, recordTime]);
  const locked =
    finalizing ||
    attempt.completedAt !== null ||
    (now !== null && attemptExpired(test, attempt, now));
  return (
    <div className="question-bank-app mock-exam" data-ui>
      <a className="skip-link" href="#main-content">
        Skip to question
      </a>
      <main
        id="main-content"
        className="solver-content"
        tabIndex={-1}
        aria-label={`${test.title}, demo attempt`}
      >
        <div className="solver-toolbar">
          <div className="solver-exit-group">
            <button
              type="button"
              className="solver-exit icon-button"
              aria-label="Exit test"
              onClick={() => setModal("exit")}
            >
              <Icon name="logout" />
            </button>
            <span className="mock-section-name">
              {examSectionNames[activeSection]}
            </span>
          </div>
          <ExamTimer
            seconds={now === null ? null : elapsedSeconds(attempt, now)}
          />
          <div className="solver-tools">
            <FlagQuestionButton
              disabled={locked}
              flagged={attempt.flags.includes(question.id)}
              onToggle={() => {
                const next = !latest.current.flags.includes(question.id);
                return change({ kind: "flag", id: question.id }, Date.now())
                  ? next
                  : latest.current.flags.includes(question.id);
              }}
            />
          </div>
        </div>
        <p className="mock-demo-notice">
          Demo: three existing Critical Thinking examples repeat across section
          slots, including Mathematics. Progress is saved only in this browser;
          no official score.
        </p>
        {error && (
          <p className="mock-save-error" role="alert">
            {error}
          </p>
        )}
        <div
          ref={readingArea}
          className={`solver-columns${question.passage.length ? "" : " without-passage"}`}
        >
          {question.passage.length > 0 && (
            <section className="passage-pane" aria-labelledby="passage-label">
              <h2 id="passage-label" className="passage-label">
                Passage
              </h2>
              <div className="passage-copy">
                {question.passage.map((paragraph, i) => (
                  <p key={`${question.id}-${i}`}>
                    <PracticeContentView content={paragraph} />
                  </p>
                ))}
              </div>
            </section>
          )}
          <section className="answer-pane" aria-labelledby="question-prompt">
            <h1 id="question-prompt" ref={heading} tabIndex={-1}>
              <PracticeContentView content={question.prompt} />
            </h1>
            <fieldset className="answer-options" disabled={locked}>
              <legend className="sr-only">
                Choose one answer. Select it again to clear your answer.
              </legend>
              {question.options.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className="answer-option"
                  data-selected={attempt.answers[question.id] === option.id}
                  data-preview={false}
                  data-checked={false}
                  aria-pressed={attempt.answers[question.id] === option.id}
                  onClick={() =>
                    change(
                      {
                        kind: "answer",
                        id: question.id,
                        option:
                          attempt.answers[question.id] === option.id
                            ? null
                            : option.id,
                      },
                      Date.now(),
                    )
                  }
                >
                  <span className="answer-letter" aria-hidden="true">
                    {option.id}
                  </span>
                  <span className="answer-copy">
                    <span className="sr-only">{option.id}. </span>
                    <PracticeContentView content={option.text} />
                  </span>
                </button>
              ))}
            </fieldset>
          </section>
        </div>
        <footer className="solver-actions" aria-label="Question actions">
          <nav className="question-navigation" aria-label="Question navigation">
            <button
              type="button"
              className="question-arrow"
              aria-label="Previous question"
              disabled={locked || sectionIndex === 0}
              onClick={() =>
                navigate(sectionQuestions[sectionIndex - 1].id, Date.now())
              }
            >
              <Icon name="arrow" size={18} />
            </button>
            <button
              type="button"
              className="question-counter"
              aria-label={`Navigate questions, question ${question.localNumber} of ${sectionQuestions.length}`}
              aria-haspopup="dialog"
              onClick={() => setModal("navigator")}
            >
              <span>Question</span>
              <strong>
                {question.localNumber}
                <span> / {sectionQuestions.length}</span>
              </strong>
            </button>
            <button
              type="button"
              className="question-arrow"
              aria-label="Next question"
              disabled={locked || isLastInSection}
              onClick={() =>
                navigate(sectionQuestions[sectionIndex + 1].id, Date.now())
              }
            >
              <Icon name="arrow" size={18} />
            </button>
          </nav>
          {isLastInSection && (
            <button
              type="button"
              className="button mock-finish"
              disabled={locked}
              onClick={() =>
                setModal(isFinalSection ? "finish" : "finish-section")
              }
            >
              <span>{isFinalSection ? "Finish Test" : "Finish Section"}</span>
            </button>
          )}
        </footer>
        <MockQuestionNavigator
          open={modal === "navigator"}
          onClose={() => setModal(null)}
          questions={sectionQuestions}
          attempt={attempt}
          onNavigate={(id) => navigate(id, Date.now())}
        />
        <PracticeDialog
          open={
            modal === "finish-section" || modal === "finish" || modal === "exit"
          }
          onClose={() => setModal(null)}
          titleId="mock-confirm-title"
          className="mock-confirm"
          initialFocus=".mock-continue"
        >
          <div className="navigator-header">
            <h2 id="mock-confirm-title">
              {modal === "finish-section"
                ? "Are you sure you want to finish this section?"
                : `Are you sure you want to ${modal === "finish" ? "finish" : "exit"}?`}
            </h2>
            <PracticeDialogClose onClose={() => setModal(null)} />
          </div>
          <p>
            {modal === "finish-section"
              ? `Once you finish ${examSectionNames[activeSection]}, you will move to the next section and won't be able to return to ${examSectionNames[activeSection]}. Any unanswered questions will remain unanswered.`
              : modal === "finish"
                ? "Once you finish, your answers will be submitted and you'll receive your Mock Test results. Any unanswered questions will be counted as omitted."
                : "You can exit now and continue this Mock Test later. If you want to receive your results, go to the final question and click Finish Test."}
          </p>
          {error && <p role="alert">{error}</p>}
          <div className="mock-confirm-actions">
            <button
              type="button"
              className="button secondary mock-continue"
              onClick={() => setModal(null)}
            >
              {modal === "finish-section"
                ? "Continue Section"
                : "Continue Test"}
            </button>
            <button
              type="button"
              className="button mock-confirm-danger"
              onClick={() => {
                if (attemptExpired(test, latest.current, Date.now())) {
                  void finish(Date.now());
                  return;
                }
                if (modal === "finish-section") finishSection(Date.now());
                else if (modal === "finish") finish(Date.now());
                else if (recordTime(Date.now()) && commit(latest.current))
                  router.push("/mock-tests");
              }}
            >
              {modal === "finish-section"
                ? "Finish Section"
                : modal === "finish"
                  ? "Finish Test"
                  : "Save & Exit"}
            </button>
          </div>
        </PracticeDialog>
      </main>
    </div>
  );
}
export function MockTestEntry({
  test,
  attemptId,
  retake,
}: {
  test: MockTest;
  attemptId?: string;
  retake: boolean;
}) {
  const router = useRouter();
  const started = useRef(false);
  const [attempt, setAttempt] = useState<DemoMockAttempt | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void Promise.resolve().then(async () => {
      try {
        const existing = readDemoAttempts(test);
        let next = attemptId
          ? existing.find((a) => a.id === attemptId)
          : !retake
            ? existing.find((a) => a.completedAt === null)
            : undefined;
        if (attemptId && !next)
          throw new Error(
            "This demo attempt is not available in this browser.",
          );
        if (next?.completedAt !== null && next) {
          router.replace(demoResultsHref(next));
          return;
        }
        if (!next) {
          next = createDemoAttempt(
            test,
            "demo-attempt-" + crypto.randomUUID(),
            Date.now(),
          );
          saveDemoAttempt(next);
        }
        if (attemptExpired(test, next, Date.now())) {
          const completed = await finalizeDemoAttempt(test, next, Date.now());
          router.replace(demoResultsHref(completed));
          return;
        }
        setAttempt(next);
        router.replace(demoTakeHref(test.id, next.id));
      } catch {
        setError(
          "Could not load or save this demo attempt. Browser storage must be available; existing records have not been replaced.",
        );
      }
    });
  }, [test, attemptId, retake, router]);
  if (!attempt)
    return (
      <div className="question-bank-app">
        <main className="practice-empty">
          <h1>{error || "Loading Mock Test…"}</h1>
          <Link href="/mock-tests" className="button secondary">
            Back to Mock Tests
          </Link>
        </main>
      </div>
    );
  return (
    <MockTestTaking key={attempt.id} test={test} initialAttempt={attempt} />
  );
}
