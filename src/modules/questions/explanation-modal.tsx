import type {
  DemoPracticeFeedback,
  PracticeQuestion,
  PracticeResponse,
} from "./practice.types";
import { PracticeDialog, PracticeDialogClose } from "./practice-dialog";
import { PracticeContentView } from "./practice-content";
import { PracticeAnswers } from "./practice-answers";
import { Icon } from "./icon";
import { SaveQuestionButton } from "./save-question-button";
import { practiceStatus } from "./practice.logic";

export function ExplanationModal({
  open,
  onClose,
  question,
  index,
  total,
  response,
  feedback,
  revealAnswer,
  onReveal,
  onNavigate,
  onSave,
  bookmarkPending = false,
  attemptAnswer,
}: {
  open: boolean;
  onClose: () => void;
  question: PracticeQuestion;
  index: number;
  total: number;
  response: PracticeResponse;
  feedback: DemoPracticeFeedback | undefined;
  revealAnswer: boolean;
  onReveal: (revealed: boolean) => void;
  onNavigate: (index: number) => void;
  onSave: () => boolean | void | Promise<boolean | void>;
  bookmarkPending?: boolean;
  /** Completed-attempt context only; never changes the Show Answer/reveal policy. */
  attemptAnswer?: string | null;
}) {
  return (
    <PracticeDialog
      open={open}
      onClose={onClose}
      titleId="review-title"
      className="explanation-dialog"
    >
      <header className="review-header">
        <span
          className="review-number"
          data-state={practiceStatus(response, feedback)}
          aria-hidden="true"
        >
          {index + 1}
        </span>
        <div className="review-context">
          <div className="review-title-row">
            <h2 id="review-title">Question {index + 1} Review</h2>
            {question.section && (
              <span className="review-section">{question.section}</span>
            )}
            {question.difficulty && (
              <span
                className="review-difficulty"
                data-state={question.difficulty}
              >
                {question.difficulty} difficulty
              </span>
            )}
          </div>
          <p>
            Topic: {question.topic}
            {question.source && <> · {question.source}</>}
          </p>
          {attemptAnswer !== undefined && (
            <p>Your answer: {attemptAnswer ?? "Omitted"}</p>
          )}
        </div>
        <div className="review-controls">
          <label className="practice-switch">
            <span>Show Answer</span>
            <input
              type="checkbox"
              role="switch"
              checked={revealAnswer}
              disabled={!feedback}
              onChange={(event) => onReveal(event.target.checked)}
            />
            <span className="switch-track" aria-hidden="true" />
          </label>
          <SaveQuestionButton
            key={question.id}
            saved={response.saved}
            pending={bookmarkPending}
            onToggle={onSave}
          />
          <button
            type="button"
            className="icon-button review-previous"
            aria-label="Review previous question"
            disabled={index === 0}
            onClick={() => onNavigate(index - 1)}
          >
            <Icon name="chevron" size={16} />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Review next question"
            disabled={index === total - 1}
            onClick={() => onNavigate(index + 1)}
          >
            <Icon name="chevron" size={16} />
          </button>
          <PracticeDialogClose onClose={onClose} />
        </div>
      </header>
      <div className="review-columns" key={question.id}>
        <section className="review-question" aria-label="Question preview">
          {question.passage.length > 0 && (
            <div className="review-passage">
              <h3>Passage</h3>
              {question.passage.map((paragraph, i) => (
                <p key={i}>
                  <PracticeContentView content={paragraph} />
                </p>
              ))}
            </div>
          )}
          <h3 className="review-prompt">
            <PracticeContentView content={question.prompt} />
          </h3>
          <PracticeAnswers
            question={question}
            response={response}
            feedback={feedback}
            revealed={revealAnswer}
            preview
          />
        </section>
        <section
          className="review-explanation"
          aria-labelledby="review-explanation-title"
        >
          <h3 id="review-explanation-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18h6m-5 3h4M8.3 13.7a5.5 5.5 0 1 1 7.4 0c-.9.8-1.2 1.4-1.2 2.3h-5c0-.9-.3-1.5-1.2-2.3Z" />
              <path d="M12 1v1M3.5 4.5l1 1M1 11h1m20 0h1m-3.5-6.5-1 1" />
            </svg>
            Explanation
          </h3>
          <div className="review-explanation-content">
            {feedback?.explanation ? (
              <PracticeContentView content={feedback.explanation} />
            ) : (
              <p>An explanation is not available for this question.</p>
            )}
          </div>
          <p className="review-question-id">{question.id}</p>
        </section>
      </div>
    </PracticeDialog>
  );
}
