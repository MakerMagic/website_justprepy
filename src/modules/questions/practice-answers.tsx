import type {
  DemoPracticeFeedback,
  PracticeQuestion,
  PracticeResponse,
} from "./practice.types";
import { optionResult, practiceResolved } from "./practice.logic";
import { PracticeContentView } from "./practice-content";

/** Shared answer renderer: checking/reveal state is owned by the session, not the rows. */
export function PracticeAnswers({
  question,
  response,
  feedback,
  revealed,
  preview = false,
  onSelect,
}: {
  question: PracticeQuestion;
  response: PracticeResponse;
  feedback: DemoPracticeFeedback | undefined;
  revealed: boolean;
  preview?: boolean;
  onSelect?: (id: string) => void;
}) {
  return (
    <fieldset className={"answer-options" + (preview ? " review-options" : "")}>
      <legend className="sr-only">
        {preview ? "Question answers" : "Choose one answer"}
      </legend>
      {question.options.map((option) => {
        const result = preview
          ? revealed && option.id === feedback?.correctOptionId
            ? "correct"
            : undefined
          : optionResult(option.id, response, feedback);
        return (
          <label
            key={option.id}
            className="answer-option"
            data-selected={!preview && response.selected === option.id}
            data-result={result}
            data-checked={Boolean(result)}
            data-preview={preview}
          >
            <input
              className="sr-only"
              type="radio"
              name={(preview ? "review-" : "answer-") + question.id}
              value={option.id}
              checked={
                preview ? result === "correct" : response.selected === option.id
              }
              disabled={preview || practiceResolved(response)}
              onChange={() => onSelect?.(option.id)}
            />
            <span className="answer-letter" aria-hidden="true">
              {option.id}
            </span>
            <span className="answer-copy">
              <span className="sr-only">{option.id}. </span>
              <PracticeContentView content={option.text} />
              {result && (
                <span className="sr-only">
                  {result === "correct"
                    ? " Correct answer."
                    : " Checked answer, incorrect."}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
