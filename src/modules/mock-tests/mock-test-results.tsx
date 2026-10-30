"use client";

import Link from "next/link";
import { Inter } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { MockTestAnalytics } from "./mock-test-analytics";
import type { DemoMockAttempt } from "./mock-test-attempt.logic";
import { StatisticCard } from "../../components/statistic-card";
import { Icon } from "../questions/icon";
import { ExplanationModal } from "../questions/explanation-modal";
import type { CompletedMockReviews } from "./mock-test-review.logic";
import { PracticeDialog } from "../questions/practice-dialog";
import type { MockTest, MockTestResultDetails } from "./mock-tests.types";
import {
  mockResultModel,
  filterResultQuestions,
  RESULT_STATUSES,
  type MockResultModel,
  type ResultFilters,
} from "./mock-test-results.logic";
import "../questions/question-bank.css";
import "../questions/question-solver.css";
import "../questions/practice-modals.css";
import "./mock-test-results.css";
import "../../components/more-analytics.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-results",
});
type ResultQuestion = MockTestResultDetails["questions"][number];
type ResultModal = { kind: "question"; question: ResultQuestion };

function ResultsSummary({ model }: { model: MockResultModel }) {
  return (
    <div className="card sum rv" data-stage="0">
      <div>
        {model.result.score === null && (
          <p>
            Demo answers evaluated. Official score unavailable: scoring rules
            are not connected.
          </p>
        )}

        <p className="lbl">Overall score</p>
        <div className="score">
          {model.result.score ?? "—"}
          <small>/ {model.test.maxScore} pts</small>
        </div>
        <span className="time">
          {model.timeSpentMinutes === null
            ? "Time spent unavailable"
            : model.timeSpentMinutes +
              " / " +
              model.test.durationMinutes +
              " min spent"}
        </span>
      </div>
      <div
        className="stats progress-stats result-stats"
        role="group"
        aria-label="Question results"
      >
        {RESULT_STATUSES.map((status) => (
          <div className="result-stat" data-status={status.id} key={status.id}>
            <StatisticCard
              label={status.label}
              motif="check"
              value={
                <>
                  {model.counts?.[status.id] ?? "—"}
                  <span className="result-percentage">
                    {model.counts
                      ? model.percentage(model.counts[status.id])
                      : "Unavailable"}
                  </span>
                </>
              }
              decoration={
                status.id === "correct" ? undefined : (
                  <svg
                    viewBox="0 0 80 80"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <circle cx="48" cy="48" r="28" />
                    <path
                      d={
                        status.id === "incorrect"
                          ? "m37 37 22 22m0-22L37 59"
                          : "M34 48h28"
                      }
                    />
                  </svg>
                )
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
function ResultSections({
  model,
  onMore,
}: {
  model: MockResultModel;
  onMore: () => void;
}) {
  return (
    <section
      className="blk rv"
      data-stage="1"
      aria-labelledby="result-section-heading"
    >
      <h2 id="result-section-heading">Section Analytics</h2>
      <div className="secs">
        {model.sections.map((section) => {
          const percent = section.result
            ? (section.result.score / section.result.maxScore) * 100
            : null;
          const color =
            percent === null
              ? undefined
              : percent >= 75
                ? "var(--ok)"
                : percent >= 60
                  ? "var(--mid)"
                  : "var(--bad)";
          return (
            <div
              className={"card sc" + (section.included ? "" : " off")}
              key={section.id}
            >
              <div className="t">
                <h3>{section.name}</h3>
                <span className="v">
                  {section.result ? (
                    <>
                      {section.result.score}{" "}
                      <small>/ {section.result.maxScore}</small>
                    </>
                  ) : (
                    "–"
                  )}
                </span>
              </div>
              <div
                className="bar"
                role={percent === null ? undefined : "img"}
                aria-label={
                  percent === null
                    ? undefined
                    : Math.round(percent) + " percent"
                }
                aria-hidden={percent === null ? true : undefined}
              >
                {percent !== null && (
                  <b style={{ width: percent + "%", background: color }} />
                )}
              </div>
              {!section.included ? (
                <p className="n">Not included in this test</p>
              ) : percent === null ? (
                <p className="n">Section result unavailable</p>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="lg">
        <span>
          <i style={{ background: "var(--ok)" }} />
          75% and above
        </span>
        <span>
          <i style={{ background: "var(--mid)" }} />
          60–74%
        </span>
        <span>
          <i style={{ background: "var(--bad)" }} />
          Below 60%
        </span>
      </div>
      <button
        className="more-analytics-action"
        type="button"
        aria-haspopup="dialog"
        onClick={onMore}
      >
        More Analytics
        <Icon name="arrow" size={15} />
      </button>
    </section>
  );
}
function ResultNavigator({
  model,
  onQuestion,
  reviews,
}: {
  model: MockResultModel;
  reviews: CompletedMockReviews;
  onQuestion: (question: ResultQuestion) => void;
}) {
  const [filters, setFilters] = useState<ResultFilters>({
    section: "all",
    status: "all",
  });
  const filtered = filterResultQuestions(model, filters);
  return (
    <section
      className="blk rv"
      data-stage="2"
      aria-labelledby="result-navigator-heading"
    >
      <h2 id="result-navigator-heading">Question Navigator</h2>
      <div className="card nav">
        <div className="bar2">
          <div className="seg" role="group" aria-label="Section">
            <button
              type="button"
              aria-pressed={filters.section === "all"}
              onClick={() =>
                setFilters((current) => ({ ...current, section: "all" }))
              }
            >
              All
            </button>
            {model.sections.map((section) => (
              <button
                key={section.id}
                type="button"
                disabled={!section.included}
                title={
                  section.included ? undefined : "Not included in this test"
                }
                aria-pressed={filters.section === section.id}
                onClick={() =>
                  setFilters((current) => ({ ...current, section: section.id }))
                }
              >
                {section.name}
              </button>
            ))}
          </div>
          <div className="seg" role="group" aria-label="Status">
            <button
              type="button"
              aria-pressed={filters.status === "all"}
              onClick={() =>
                setFilters((current) => ({ ...current, status: "all" }))
              }
            >
              All
              <em>
                {filtered.counts?.all ??
                  (filters.section === "all" ? model.test.questionCount : "—")}
              </em>
            </button>
            {RESULT_STATUSES.map((status) => (
              <button
                key={status.id}
                type="button"
                aria-pressed={filters.status === status.id}
                onClick={() =>
                  setFilters((current) => ({ ...current, status: status.id }))
                }
              >
                {status.label}
                <em>{filtered.counts?.[status.id] ?? "—"}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="grid" aria-live="polite">
          {filtered.questions?.length ? (
            filtered.questions.map((question) => {
              const status = RESULT_STATUSES.find(
                (item) => item.id === question.status,
              )!;
              const section = model.sections.find(
                (item) => item.id === question.section,
              )!;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={"q " + status.short}
                  aria-label={
                    "Question " +
                    (reviews[question.id]?.question.localNumber ??
                      question.number) +
                    ", " +
                    (reviews[question.id]?.question.section ?? section.name) +
                    ", " +
                    status.label
                  }
                  aria-haspopup="dialog"
                  onClick={() => onQuestion(question)}
                >
                  {reviews[question.id]?.question.localNumber ??
                    question.number}
                </button>
              );
            })
          ) : (
            <p className="empty">
              {model.questions
                ? "No questions match this filter."
                : "Question-level results are not available for this session."}
            </p>
          )}
        </div>
        <div className="lg2">
          {RESULT_STATUSES.map((status) => (
            <span key={status.id}>
              <i className={status.short} />
              {status.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
export function MockTestResults({
  test,
  illustrative = false,
  reviews = {},
  attempt,
}: {
  test: MockTest;
  illustrative?: boolean;
  reviews?: CompletedMockReviews;
  attempt?: DemoMockAttempt;
}) {
  const model = useMemo(() => mockResultModel(test), [test]);
  const root = useRef<HTMLDivElement>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [modal, setModal] = useState<ResultModal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [revealAnswer, setRevealAnswer] = useState(false);
  const [savedQuestions, setSavedQuestions] = useState<Record<string, boolean>>(
    {},
  );
  const review = reviewId ? reviews[reviewId] : undefined;
  const reviewSection = review
    ? Object.values(reviews).filter(
        (item) => item.question.examSection === review.question.examSection,
      )
    : [];
  const close = () => setModalOpen(false);
  const show = (content: ResultModal) => {
    setModal(content);
    setModalOpen(true);
  };
  useEffect(() => {
    const elements = root.current?.querySelectorAll<HTMLElement>(".rv") ?? [];
    if (
      !("IntersectionObserver" in window) ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      elements.forEach((element) => element.classList.add("on"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("on");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  if (!model)
    return (
      <main className="mock-results">
        <div className="w">
          <Link className="back" href="/mock-tests">
            Back to Mock Tests
          </Link>
          <h1>Results unavailable</h1>
        </div>
      </main>
    );
  const question = modal?.kind === "question" ? modal.question : null;
  const modalStatus = question
    ? RESULT_STATUSES.find((status) => status.id === question.status)
    : null;
  const modalSection = question
    ? model.sections.find((section) => section.id === question.section)
    : null;
  return (
    <>
      <div ref={root} className={"mock-results " + inter.variable}>
        <main className="w" id="main-content">
          <Link className="back" href="/mock-tests">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M19 12H5m6-6-6 6 6 6" />
            </svg>
            Back to Mock Tests
            <span className="sid">Session #{model.sessionId}</span>
          </Link>
          <h1>{test.title} results</h1>
          {illustrative && (
            <p className="result-data-note">
              Illustrative test result details.
            </p>
          )}
          <ResultsSummary model={model} />
          <ResultSections model={model} onMore={() => setAnalyticsOpen(true)} />
          <ResultNavigator
            model={model}
            reviews={reviews}
            onQuestion={(question) => {
              if (reviews[question.id]) {
                setReviewId(question.id);
                setRevealAnswer(false);
                setReviewOpen(true);
              } else show({ kind: "question", question });
            }}
          />
        </main>
        <PracticeDialog
          open={modalOpen}
          onClose={close}
          titleId="mock-result-modal-title"
          className="results-modal"
          initialFocus=".results-close-icon"
        >
          <button
            className="x results-close-icon"
            type="button"
            aria-label="Close"
            onClick={close}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M5 5l14 14M19 5 5 19" />
            </svg>
          </button>
          <h2 id="mock-result-modal-title">
            {question ? "Question " + question.number : "More Analytics"}
          </h2>
          {question && modalStatus ? (
            <>
              <span className={"result-status-chip " + modalStatus.short}>
                {modalStatus.label}
              </span>
              <p>{modalSection?.name}</p>
              <div className="ph">
                The original question and explanation are unavailable for this
                historical attempt.
              </div>
            </>
          ) : (
            <>
              <p>
                Question details are unavailable for this historical attempt.
              </p>
            </>
          )}
          <button className="close2" type="button" onClick={close}>
            Close
          </button>
        </PracticeDialog>
      </div>
      <MockTestAnalytics
        key={model.sessionId}
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        test={test}
        attempt={attempt}
        fontClass={inter.variable}
      />
      {review && (
        <ExplanationModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          question={review.question}
          index={review.question.localNumber - 1}
          total={reviewSection.length}
          response={{
            ...review.response,
            saved: savedQuestions[review.question.id] ?? false,
          }}
          feedback={review.feedback}
          revealAnswer={revealAnswer}
          onReveal={setRevealAnswer}
          attemptAnswer={review.response.selected}
          onNavigate={(index) => {
            const target = reviewSection[index];
            if (target) {
              setReviewId(target.question.id);
              setRevealAnswer(false);
            }
          }}
          onSave={() => {
            const id = review.question.id,
              next = !(savedQuestions[id] ?? false);
            setSavedQuestions((current) => ({ ...current, [id]: next }));
            return next;
          }}
        />
      )}
    </>
  );
}
