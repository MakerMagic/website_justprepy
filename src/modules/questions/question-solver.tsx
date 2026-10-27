"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { QuestionBankData } from "./question-bank.types";
import type {
  DemoPracticeFeedback,
  PracticeQuestion,
  PracticeResponse,
} from "./practice.types";
import { Icon } from "./icon";
import { PracticeContentView } from "./practice-content";
import { PracticeAnswers } from "./practice-answers";
import { SaveQuestionButton } from "./save-question-button";
import { QuestionNavigator } from "./question-navigator";
import { ExplanationModal } from "./explanation-modal";
import {
  emptyPracticeResponse,
  checkPracticeResponse,
  practiceResolved,
  practiceStatus,
  updatePracticeResponse,
} from "./practice.logic";
import "./question-bank.css";
import "./question-solver.css";
import "./practice-modals.css";

function PracticeTimer() {
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [paused]);
  const time = `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  return (
    <button
      type="button"
      className="practice-timer"
      onClick={() => setPaused((value) => !value)}
      aria-pressed={paused}
      aria-label={`${paused ? "Resume" : "Pause"} practice timer`}
      title={paused ? "Resume timer" : "Pause timer"}
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
        {paused ? "Paused" : "Timer"}
        <span className="timer-colon">:</span>
      </span>
      <span className="timer-value">{time}</span>
    </button>
  );
}

export function QuestionSolver({
  questions,
  feedback,
}: {
  questions: PracticeQuestion[];
  feedback: Record<string, DemoPracticeFeedback>;
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
}) {
  const [current, setCurrent] = useState(0);
  const [responses, setResponses] = useState<Record<string, PracticeResponse>>(
    {},
  );
  const [modal, setModal] = useState<"navigator" | "explanation" | null>(null);
  const [reviewReveal, setReviewReveal] = useState(false);
  const bookmarkLocks = useRef(new Set<string>());
  const [bookmarkPending, setBookmarkPending] = useState<
    Record<string, boolean>
  >({});
  const heading = useRef<HTMLHeadingElement>(null);
  const readingArea = useRef<HTMLDivElement>(null);
  const question = questions[current];
  const response = question
    ? (responses[question.id] ?? emptyPracticeResponse)
    : emptyPracticeResponse;
  const review = question ? feedback[question.id] : undefined;
  const status = practiceStatus(response, review);

  async function toggleBookmark() {
    if (!question || bookmarkLocks.current.has(question.id))
      throw new Error("Bookmark operation already pending");
    const id = question.id;
    const saved = !response.saved;
    bookmarkLocks.current.add(id);
    setBookmarkPending((previous) => ({ ...previous, [id]: true }));
    try {
      // Existing demo persistence boundary: session memory only, no server request.
      await Promise.resolve();
      setResponses((previous) =>
        updatePracticeResponse(previous, id, { saved }),
      );
      return saved;
    } finally {
      bookmarkLocks.current.delete(id);
      setBookmarkPending((previous) => ({ ...previous, [id]: false }));
    }
  }

  function updateResponse(
    update: Partial<Pick<PracticeResponse, "selected" | "saved">>,
  ) {
    if (!question) return;
    setResponses((previous) =>
      updatePracticeResponse(previous, question.id, update),
    );
  }
  function navigate(index: number, keepReview = false) {
    if (index < 0 || index >= questions.length) return;
    setCurrent(index);
    if (!keepReview) setModal(null);
    setReviewReveal(false);
    requestAnimationFrame(() => {
      readingArea.current?.scrollTo({ top: 0, behavior: "instant" });
      if (window.matchMedia("(max-width: 899px)").matches)
        window.scrollTo({ top: 0, behavior: "instant" });
      if (!modal) heading.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className="question-bank-app">
      <a className="skip-link" href="#main-content">
        Skip to question
      </a>
      {!question ? (
        <main id="main-content" className="practice-empty" tabIndex={-1}>
          <h1>No questions available</h1>
          <Link href="/" className="button secondary">
            Back to Question Bank
          </Link>
        </main>
      ) : (
        <main
          id="main-content"
          tabIndex={-1}
          className="solver-content"
          aria-label="Demo question practice"
        >
          <div className="solver-toolbar">
            <div className="solver-exit-group">
              <Link
                href="/"
                className="solver-exit icon-button"
                aria-label="Exit practice and return to Question Bank"
                title="Exit practice"
              >
                <Icon name="logout" />
              </Link>
              <span className="practice-demo-label">Demo practice</span>
            </div>
            <PracticeTimer />
            <div className="solver-tools">
              <SaveQuestionButton
                key={question.id}
                saved={response.saved}
                pending={bookmarkPending[question.id] ?? false}
                onToggle={toggleBookmark}
              />
              <span className="question-topic">{question.topic}</span>
            </div>
          </div>

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
                  {question.passage.map((paragraph, index) => (
                    <p key={`${question.id}-${index}`}>
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
              <PracticeAnswers
                question={question}
                response={response}
                feedback={review}
                revealed={response.checked}
                onSelect={(selected) => updateResponse({ selected })}
              />
              <div className="sr-only" role="status" aria-atomic="true">
                {response.checked
                  ? status === "correct"
                    ? "Your answer is correct."
                    : status === "partial"
                      ? "Correct after an earlier incorrect attempt."
                      : "Your answer is incorrect. Choose another option and check again."
                  : ""}
              </div>
            </section>
          </div>

          <footer className="solver-actions" aria-label="Question actions">
            <button
              type="button"
              className="button secondary explanation-button"
              aria-haspopup="dialog"
              aria-controls="review-title-dialog"
              onClick={() => {
                setReviewReveal(false);
                setModal("explanation");
              }}
            >
              <Icon name="book" size={17} />
              Explanation
            </button>
            <nav
              className="question-navigation"
              aria-label="Question navigation"
            >
              <button
                type="button"
                className="question-arrow"
                aria-label="Previous question"
                disabled={current === 0}
                onClick={() => navigate(current - 1)}
              >
                <Icon name="arrow" size={18} />
              </button>
              <button
                type="button"
                className="question-counter"
                aria-label={`Navigate questions, question ${current + 1} of ${questions.length}`}
                aria-haspopup="dialog"
                aria-controls="navigator-title-dialog"
                onClick={() => setModal("navigator")}
              >
                <span>Question</span>
                <strong>
                  {current + 1}
                  <span> / {questions.length}</span>
                </strong>
              </button>
              <button
                type="button"
                className="question-arrow"
                aria-label="Next question"
                disabled={current === questions.length - 1}
                onClick={() => navigate(current + 1)}
              >
                <Icon name="arrow" size={18} />
              </button>
            </nav>
            <button
              type="button"
              className="button primary check-answer"
              disabled={
                !response.selected ||
                response.checked ||
                !review ||
                practiceResolved(response)
              }
              onClick={() =>
                setResponses((previous) =>
                  checkPracticeResponse(previous, question.id, review),
                )
              }
            >
              {response.checked ? (
                <>
                  <Icon name="check" size={17} />
                  Checked
                </>
              ) : (
                "Check"
              )}
            </button>
          </footer>
          <QuestionNavigator
            open={modal === "navigator"}
            onClose={() => setModal(null)}
            questions={questions}
            current={current}
            responses={responses}
            feedback={feedback}
            onNavigate={(index) => navigate(index)}
          />
          <ExplanationModal
            open={modal === "explanation"}
            onClose={() => setModal(null)}
            question={question}
            index={current}
            total={questions.length}
            response={response}
            feedback={review}
            revealAnswer={reviewReveal}
            onReveal={setReviewReveal}
            onNavigate={(index) => navigate(index, true)}
            bookmarkPending={bookmarkPending[question.id] ?? false}
            onSave={toggleBookmark}
          />
        </main>
      )}
    </div>
  );
}
