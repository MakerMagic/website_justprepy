"use client";

import { useRef, useState } from "react";
import type {
  DemoPracticeFeedback,
  PracticeQuestion,
  PracticeResponse,
} from "./practice.types";
import { navigatorTarget, practiceStatus } from "./practice.logic";
import { PracticeDialog, PracticeDialogClose } from "./practice-dialog";

const statusLegend = [
  ["correct", "Correct"],
  ["partial", "Partly correct"],
  ["wrong", "Wrong"],
  ["unanswered", "Unanswered"],
] as const;
const difficultyLegend = [
  ["easy", "Easy"],
  ["medium", "Medium"],
  ["hard", "Hard"],
] as const;

export function QuestionNavigator({
  open,
  onClose,
  questions,
  current,
  responses,
  feedback,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  questions: PracticeQuestion[];
  current: number;
  responses: Record<string, PracticeResponse>;
  feedback: Record<string, DemoPracticeFeedback>;
  onNavigate: (index: number) => void;
}) {
  const [showDifficulty, setShowDifficulty] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const hasDifficulty = questions.some((question) => question.difficulty);
  const difficultyMode = showDifficulty && hasDifficulty;
  const unknownDifficulty = questions.some((question) => !question.difficulty);
  return (
    <PracticeDialog
      open={open}
      onClose={onClose}
      titleId="navigator-title"
      className="navigator-dialog"
      initialFocus='[aria-current="step"]'
    >
      <header className="navigator-header">
        <h2 id="navigator-title">Navigate Questions</h2>
        {hasDifficulty && (
          <label className="practice-switch">
            <span>Show Difficulty</span>
            <input
              type="checkbox"
              role="switch"
              checked={showDifficulty}
              onChange={(event) => setShowDifficulty(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
        )}
        <PracticeDialogClose onClose={onClose} />
      </header>
      <div
        className="navigator-grid"
        ref={grid}
        onKeyDown={(event) => {
          const target = event.target;
          if (!(target instanceof HTMLButtonElement)) return;
          const buttons = [
            ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
              "button",
            ),
          ];
          const columns = getComputedStyle(
            event.currentTarget,
          ).gridTemplateColumns.split(" ").length;
          const index = navigatorTarget(
            buttons.indexOf(target),
            event.key,
            questions.length,
            columns,
          );
          if (index !== null) {
            event.preventDefault();
            buttons[index]?.focus();
          }
        }}
      >
        {questions.map((question, index) => {
          const status = practiceStatus(
            responses[question.id],
            feedback[question.id],
          );
          const state = difficultyMode
            ? (question.difficulty ?? "unknown")
            : status;
          return (
            <button
              type="button"
              className="navigator-question"
              key={question.id}
              data-state={state}
              aria-current={index === current ? "step" : undefined}
              aria-label={
                "Question " +
                (index + 1) +
                ", " +
                state +
                (index === current ? ", current question" : "")
              }
              onClick={() => onNavigate(index)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <div
        className="navigator-legend"
        aria-label={
          difficultyMode ? "Difficulty legend" : "Answer status legend"
        }
      >
        {(difficultyMode ? difficultyLegend : statusLegend).map(
          ([state, label]) => (
            <span key={state}>
              <i
                className="navigator-swatch"
                data-state={state}
                aria-hidden="true"
              />
              {label}
            </span>
          ),
        )}
        {difficultyMode && unknownDifficulty && (
          <span>
            <i
              className="navigator-swatch"
              data-state="unknown"
              aria-hidden="true"
            />
            Unavailable
          </span>
        )}
      </div>
    </PracticeDialog>
  );
}
