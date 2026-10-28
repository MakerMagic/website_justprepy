"use client";

import { useState } from "react";
import Link from "next/link";
import { StatisticCard } from "../../components/statistic-card";
import { PracticeShell } from "../questions/practice-shell";
import {
  PracticeDialog,
  PracticeDialogClose,
} from "../questions/practice-dialog";
import { Icon } from "../questions/icon";
import type { QuestionBankData } from "../questions/question-bank.types";
import {
  defaultMockFilters,
  filterMockTests,
  mockTestActions,
  summarizeMockTests,
} from "./mock-tests.logic";
import type { MockAction, MockFilters, MockTest } from "./mock-tests.types";
import "../questions/practice-modals.css";
import "./mock-tests.css";

const subjectLabels = [
  ["criticalThinking", "Critical Thinking"],
  ["problemSolving", "Problem Solving"],
  ["mathematics", "Mathematics"],
] as const;
const actionLabels: Record<MockAction, string> = {
  start: "Start Test",
  analyze: "Analyze",
  retake: "Retake",
};
type Preview =
  | { kind: "stat"; metric: "completed" | "average" }
  | { kind: "action"; test: MockTest; action: MockAction };

export function MockTestCard({
  test,
  onAction,
  entranceDelay = 0,
}: {
  test: MockTest;
  onAction: (test: MockTest, action: MockAction) => void;
  entranceDelay?: number;
}) {
  return (
    <article
      className="mock-card"
      aria-labelledby={`test-${test.id}`}
      data-completed={test.result !== null}
      style={{ animationDelay: `${entranceDelay}ms` }}
    >
      <header className="mock-card-heading">
        <div>
          <h3 id={`test-${test.id}`}>{test.title}</h3>
        </div>
        <span className="mock-passed">{test.passedCount} Passed</span>
      </header>
      <dl className="mock-subjects">
        {subjectLabels.map(([key, label]) => {
          const difficulty = test.subjects[key];
          return (
            <div key={key} data-excluded={difficulty === null}>
              <dt>{label}</dt>
              <dd
                className="review-difficulty mock-difficulty"
                data-state={difficulty ?? "excluded"}
              >
                {difficulty ?? "Excluded"}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mock-test-meta">
        <span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          {test.durationMinutes} Mins
        </span>
        <span>{test.questionCount} Questions</span>
      </div>
      <div className="mock-score" data-completed={test.result !== null}>
        <span className="mock-score-label">
          {test.result !== null && (
            <span className="mock-score-tick" aria-hidden="true">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 5 5 9-10" />
              </svg>
            </span>
          )}
          Your Score
        </span>
        <strong>
          {test.result?.score ?? "?"}
          <span> / {test.maxScore}</span>
        </strong>
      </div>
      <div className="mock-card-actions">
        {mockTestActions(test).map((action) => {
          const label = actionLabels[action];
          const className = `button ${action === "analyze" ? "accent" : action === "retake" ? "secondary" : "primary"}`;
          const contents = (
            <>
              {label}
              {action === "start" ? (
                <Icon name="arrow" size={15} />
              ) : (
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
                  <path
                    d={
                      action === "analyze"
                        ? "M5 20V11M12 20V4M19 20v-6"
                        : "M4 12a8 8 0 1 0 3-6.2M4 4v5h5"
                    }
                  />
                </svg>
              )}
            </>
          );
          const destination = test.destinations?.[action];
          return destination ? (
            <Link key={action} href={destination} className={className}>
              {contents}
            </Link>
          ) : (
            <button
              key={action}
              type="button"
              className={className}
              aria-haspopup="dialog"
              onClick={() => onAction(test, action)}
            >
              {contents}
            </button>
          );
        })}
      </div>
    </article>
  );
}

export function MockTests({
  tests,
  profile,
  telegramUrl,
}: {
  tests: MockTest[];
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
}) {
  const [filters, setFilters] = useState<MockFilters>({
    ...defaultMockFilters,
  });
  const [filterRevision, setFilterRevision] = useState(0);
  const changeFilters = (
    next: MockFilters | ((current: MockFilters) => MockFilters),
  ) => {
    setFilters(next);
    setFilterRevision((current) => current + 1);
  };
  const [preview, setPreview] = useState<Preview | null>(null);
  const filtered = filterMockTests(tests, filters);
  const stats = summarizeMockTests(tests);
  const reset = () => changeFilters({ ...defaultMockFilters });
  const previewTitle =
    preview?.kind === "stat"
      ? preview.metric === "completed"
        ? "Tests Passed"
        : "Average Last 3"
      : preview
        ? `${actionLabels[preview.action]} · ${preview.test.title}`
        : "Mock Tests";

  return (
    <PracticeShell
      profile={profile}
      telegramUrl={telegramUrl}
      skipLabel="Skip to mock tests"
    >
      <main
        id="main-content"
        tabIndex={-1}
        className="bank-content mock-content"
        data-ui
      >
        <section className="page-heading" aria-label="Introductory">
          <div className="intro-copy">
            <h1>Mock Tests</h1>
            <p>
              Choose a full simulation or focus on a section. Illustrative tests
              and results.
            </p>
          </div>
          <div
            className="practice-stats progress-stats"
            role="group"
            aria-label="Illustrative mock-test progress"
            title="Illustrative progress from temporary frontend fixtures"
          >
            <StatisticCard
              label="Tests Passed"
              value={stats.completed}
              motif="check"
              pressable
            />
            <StatisticCard
              label="Average Last 3"
              value={stats.average ?? "—"}
              motif="trend"
              pressable
            />
          </div>
        </section>
        <section
          className="mock-catalogue"
          aria-labelledby="mock-filter-heading"
        >
          <div className="mock-filter-bar">
            <div className="mock-filter-title">
              <Icon name="filter" size={18} />
              <h2 id="mock-filter-heading">Filter Tests</h2>
              <span className="mock-availability" role="status">
                {filtered.length} Available
              </span>
            </div>
            <div className="mock-filter-controls">
              <div
                role="group"
                aria-label="Completion status"
                className="mock-filter-group"
              >
                <button
                  type="button"
                  className="chip"
                  aria-pressed={
                    filters.status === "all" && filters.type === "all"
                  }
                  onClick={reset}
                >
                  All
                </button>
                {(["solved", "unsolved"] as const).map((status) => (
                  <button
                    type="button"
                    key={status}
                    className="chip"
                    aria-pressed={filters.status === status}
                    onClick={() =>
                      changeFilters((current) => ({
                        ...current,
                        status: current.status === status ? "all" : status,
                      }))
                    }
                  >
                    {status === "solved" ? "Solved" : "Unsolved"}
                  </button>
                ))}
              </div>
              <div
                role="group"
                aria-label="Test sections"
                className="mock-filter-group mock-type-filters"
              >
                {(
                  [
                    ["full", "Full"],
                    ["crit-ps", "Crit + PS"],
                    ["math", "Math"],
                  ] as const
                ).map(([type, label]) => (
                  <button
                    type="button"
                    key={type}
                    className="chip"
                    aria-pressed={filters.type === type}
                    onClick={() =>
                      changeFilters((current) => ({
                        ...current,
                        type: current.type === type ? "all" : type,
                      }))
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <h2 className="sr-only">Available mock tests</h2>
          {filtered.length ? (
            <div className="mock-grid" key={filterRevision}>
              {filtered.map((test, index) => (
                <MockTestCard
                  key={test.id}
                  test={test}
                  entranceDelay={index * 50}
                  onAction={(test, action) =>
                    setPreview({ kind: "action", test, action })
                  }
                />
              ))}
            </div>
          ) : (
            <div className="empty-state" role="status">
              <Icon name="filter" />
              <h3>No tests match these filters.</h3>
              <button
                type="button"
                className="button secondary"
                onClick={reset}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </main>
      <PracticeDialog
        open={preview !== null}
        onClose={() => setPreview(null)}
        titleId="mock-preview-title"
        className="topic-dialog mock-preview"
      >
        <div className="popover-heading">
          <h2 id="mock-preview-title">{previewTitle}</h2>
          <PracticeDialogClose onClose={() => setPreview(null)} />
        </div>
        {preview?.kind === "stat" ? (
          <>
            <dl className="preview-stats">
              <div>
                <dt>
                  {preview.metric === "completed"
                    ? "Tests completed"
                    : "Average score"}
                </dt>
                <dd>
                  {preview.metric === "completed"
                    ? stats.completed
                    : (stats.average ?? "—")}
                </dd>
              </div>
              <div>
                <dt>
                  {preview.metric === "completed"
                    ? "Available tests"
                    : "Completed tests used"}
                </dt>
                <dd>
                  {preview.metric === "completed"
                    ? tests.length
                    : stats.recent.length}
                </dd>
              </div>
            </dl>
            <p className="preview-note">
              Illustrative progress from temporary frontend data.
              {preview.metric === "average"
                ? " Uses the most recent three completed tests, or fewer when fewer are available."
                : ""}
            </p>
          </>
        ) : preview ? (
          <p className="preview-note">
            {actionLabels[preview.action]} is not available in this frontend
            preview. Your test progress has not changed.
          </p>
        ) : null}
        <button
          type="button"
          className="button primary"
          onClick={() => setPreview(null)}
        >
          Back to Mock Tests
        </button>
      </PracticeDialog>
    </PracticeShell>
  );
}
