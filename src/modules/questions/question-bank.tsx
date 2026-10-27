"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StatisticCard } from "../../components/statistic-card";
import type { QuestionBankData } from "./question-bank.types";
import {
  defaultFilters,
  filterQuestions,
  summarize,
} from "./question-bank.logic";
import { PracticeShell } from "./practice-shell";
import { Filters } from "./filters";
import { SubjectCard } from "./subject-card";
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
  return (
    <PracticeShell profile={data.profile} telegramUrl={data.telegramUrl}>
      <main id="main-content" tabIndex={-1} className="bank-content">
        <section className="page-heading" aria-label="Introductory">
          <div className="intro-copy">
            <h1 id="page-title">Question Bank</h1>
            <p>
              You can use different filters to choose apt questions to practice
            </p>
          </div>
          <div
            className="practice-stats progress-stats"
            role="group"
            aria-label="Illustrative overall progress"
            title="Illustrative progress from temporary frontend fixtures"
          >
            <StatisticCard
              label="Questions Solved"
              value={stats.answered}
              motif="check"
              onClick={() =>
                setPreview({
                  kind: "statistic",
                  metric: "solved",
                  title: "Questions Solved",
                })
              }
            />
            <StatisticCard
              label="Accuracy"
              motif="trend"
              value={
                stats.accuracy === null ? (
                  "—"
                ) : (
                  <>
                    {stats.accuracy}
                    <span>%</span>
                  </>
                )
              }
              onClick={() =>
                setPreview({
                  kind: "statistic",
                  metric: "accuracy",
                  title: "Accuracy",
                })
              }
            />
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
              Illustrative set. Try the question-solving interface with demo
              content.
            </p>
          </>
        )}
        {preview?.kind === "topic" ? (
          <Link href="/practice" className="button primary">
            Open demo practice
          </Link>
        ) : (
          <button
            type="button"
            className="button primary"
            onClick={() => dialog.current?.close()}
          >
            Back to Question Bank
          </button>
        )}
      </dialog>
    </PracticeShell>
  );
}
