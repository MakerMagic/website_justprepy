"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { QuestionBankData } from "./question-bank.types";
import {
  defaultFilters,
  filterQuestions,
  summarize,
} from "./question-bank.logic";
import { Sidebar } from "./sidebar";
import { Filters } from "./filters";
import { SubjectCard } from "./subject-card";
import { Popover } from "./popover";
import { Icon } from "./icon";
import "./question-bank.css";

type Preview = { title: string } & (
  | { kind: "topic"; topicIds: string[] }
  | { kind: "statistic"; metric: "solved" | "accuracy" }
);
export function QuestionBank({ data }: { data: QuestionBankData }) {
  const [filters, setFilters] = useState({ ...defaultFilters });
  const [preview, setPreview] = useState<Preview | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const filtered = filterQuestions(data.questions, filters);
  const stats = summarize(data.questions);
  const selection = summarize(
    preview?.kind === "topic"
      ? filtered.filter((question) =>
          preview.topicIds.includes(question.topicId),
        )
      : [],
  );
  useEffect(() => {
    if (preview && !dialog.current?.open) dialog.current?.showModal();
  }, [preview]);
  const telegramLabel = (
    <>
      <Icon name="community" size={18} />
      <span>Join Our Telegram Channel</span>
      <Icon name="arrow" size={15} />
    </>
  );
  return (
    <div className="question-bank-app">
      <a className="skip-link" href="#main-content">
        Skip to question bank
      </a>
      <Sidebar profile={data.profile} />
      <div className="workspace">
        <header className="workspace-header">
          <div className="header-context">
            <Image
              className="mobile-brand"
              src="/brand/justprepy-logo.png"
              width={347}
              height={86}
              alt="JustPrepy"
            />
            <span>NUET Practice</span>
          </div>
          {data.telegramUrl ? (
            <a
              className="telegram-cta"
              href={data.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {telegramLabel}
            </a>
          ) : (
            <Popover
              id="telegram-notice"
              title="Telegram"
              className="telegram-popover"
              triggerClassName="telegram-cta"
              trigger={telegramLabel}
            >
              <p className="telegram-note">
                The Telegram channel link has not been provided yet.
              </p>
            </Popover>
          )}
        </header>
        <main id="main-content" tabIndex={-1} className="bank-content">
          <section className="page-heading" aria-label="Introductory">
            <div className="intro-copy">
              <h1 id="page-title">Question Bank</h1>
              <p>
                You can use different filters to choose apt questions to
                practice
              </p>
            </div>
            <div
              className="practice-stats"
              role="group"
              aria-label="Illustrative overall progress"
              title="Illustrative progress from temporary frontend fixtures"
            >
              <button
                type="button"
                className="stat-card"
                aria-haspopup="dialog"
                onClick={() =>
                  setPreview({
                    kind: "statistic",
                    metric: "solved",
                    title: "Questions Solved",
                  })
                }
              >
                <span className="stat-label">Questions Solved</span>
                <span className="stat-value">{stats.answered}</span>
                <svg
                  className="stat-motif"
                  viewBox="0 0 80 80"
                  aria-hidden="true"
                >
                  <circle cx="48" cy="48" r="28" />
                  <path d="m32 48 11 11 23-26" />
                </svg>
              </button>
              <button
                type="button"
                className="stat-card"
                aria-haspopup="dialog"
                onClick={() =>
                  setPreview({
                    kind: "statistic",
                    metric: "accuracy",
                    title: "Accuracy",
                  })
                }
              >
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">
                  {stats.accuracy === null ? (
                    "—"
                  ) : (
                    <>
                      {stats.accuracy}
                      <span>%</span>
                    </>
                  )}
                </span>
                <svg
                  className="stat-motif"
                  viewBox="0 0 80 80"
                  aria-hidden="true"
                >
                  <path d="M16 10v62h60M24 58l17-19 13 10 22-29" />
                </svg>
              </button>
            </div>
          </section>
          <Filters
            value={filters}
            onChange={setFilters}
            sources={data.sources.filter(
              (source) => source.id === "tsa-oxford" || source.id === "bmat",
            )}
            matching={filtered.length}
          />
          <section className="tasks-section" aria-label="Tasks">
            <h2 className="sr-only">Tasks</h2>
            {!filtered.length ? (
              <div className="empty-state" role="status">
                <Icon name="filter" />
                <h3>No questions match these filters.</h3>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setFilters({ ...defaultFilters })}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="subject-grid">
                {data.subjects.map((subject) => (
                  <SubjectCard
                    key={subject.id}
                    subject={subject}
                    questions={filtered}
                    onSelect={(title, topicIds) =>
                      setPreview({ kind: "topic", title, topicIds })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
      <dialog
        ref={dialog}
        className="topic-dialog"
        aria-labelledby="preview-title"
        onClose={() => setPreview(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              dialog.current?.close();
          }
        }}
      >
        <div className="popover-heading">
          <h2 id="preview-title">{preview?.title}</h2>
          <button
            type="button"
            className="icon-button"
            autoFocus
            aria-label="Close preview"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="cross" />
          </button>
        </div>
        {preview?.kind === "statistic" ? (
          <>
            <dl className="preview-stats">
              <div>
                <dt>
                  {preview.metric === "solved"
                    ? "Questions solved"
                    : "Correct answers"}
                </dt>
                <dd>
                  {preview.metric === "solved" ? stats.answered : stats.correct}
                </dd>
              </div>
              <div>
                <dt>
                  {preview.metric === "solved"
                    ? "Total questions"
                    : "Questions answered"}
                </dt>
                <dd>
                  {preview.metric === "solved" ? stats.total : stats.answered}
                </dd>
              </div>
            </dl>
            <p className="preview-note">
              Illustrative overall progress from temporary frontend data.
            </p>
          </>
        ) : (
          <>
            <dl className="preview-stats">
              <div>
                <dt>Available questions</dt>
                <dd>{selection.total}</dd>
              </div>
              <div>
                <dt>Already solved</dt>
                <dd>{selection.answered}</dd>
              </div>
            </dl>
            <p className="preview-note">
              Illustrative set. Question content and practice sessions will be
              connected later.
            </p>
          </>
        )}
        <button
          type="button"
          className="button primary"
          onClick={() => dialog.current?.close()}
        >
          {preview?.kind === "topic"
            ? "Back to topics"
            : "Back to Question Bank"}
        </button>
      </dialog>
    </div>
  );
}
