import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  createDemoAttempt,
  demoExamQuestions,
  changeDemoAttempt,
  finishDemoAttempt,
} from "./mock-test-attempt.logic";
import { completedDemoReviews } from "./mock-test-review.logic";
import { demoPracticeFeedback } from "../questions/practice.fixtures";
import { ExplanationModal } from "../questions/explanation-modal";
const test = demoMockTests[0],
  qs = demoExamQuestions(test);
describe("Completed Mock Test explanations", () => {
  it("does not release review material for an active or different test", () => {
    const a = createDemoAttempt(test, "demo-attempt-review", 1000);
    expect(completedDemoReviews(test, a)).toEqual({});
    expect(
      completedDemoReviews(demoMockTests[1], finishDemoAttempt(a, 2000)),
    ).toEqual({});
  });
  it("maps both local Question 1 records to their independent composite IDs and saved answers", () => {
    let a = createDemoAttempt(test, "demo-attempt-review", 1000);
    a = changeDemoAttempt(a, qs, { kind: "answer", id: qs[0].id, option: "B" });
    a = changeDemoAttempt(a, qs, { kind: "finish-section" });
    a = changeDemoAttempt(a, qs, {
      kind: "answer",
      id: qs[30].id,
      option: "D",
    });
    const reviews = completedDemoReviews(test, finishDemoAttempt(a, 2000));
    expect(Object.keys(reviews)).toHaveLength(60);
    expect(reviews[qs[0].id].response.selected).toBe("B");
    expect(reviews[qs[30].id].response.selected).toBe("D");
    expect(reviews[qs[0].id].question.localNumber).toBe(1);
    expect(reviews[qs[30].id].question.localNumber).toBe(1);
    expect(reviews[qs[0].id].question.section).toBe("Mathematics");
    expect(reviews[qs[30].id].question.section).toBe(
      "Critical Thinking + Problem Solving",
    );
    for (const q of qs) {
      expect(reviews[q.id].question.prompt).toEqual(q.prompt);
      expect(reviews[q.id].feedback).toEqual(demoPracticeFeedback[q.sourceId]);
    }
  });
  it("reuses the existing modal with its Show Answer policy and unchanged canonical feedback", () => {
    const review = completedDemoReviews(
      test,
      finishDemoAttempt(
        createDemoAttempt(test, "demo-attempt-review", 1000),
        2000,
      ),
    )[qs[0].id];
    const props = {
      open: false,
      onClose: () => {},
      question: review.question,
      index: 0,
      total: 30,
      response: review.response,
      feedback: review.feedback,
      onReveal: () => {},
      onNavigate: () => {},
      onSave: () => {},
    };
    const hidden = renderToStaticMarkup(
        <ExplanationModal {...props} revealAnswer={false} />,
      ),
      shown = renderToStaticMarkup(
        <ExplanationModal {...props} revealAnswer />,
      );
    expect(hidden).toContain("explanation-dialog");
    expect(hidden).toContain("Show Answer");
    expect(hidden).not.toContain("Your answer:");
    expect(hidden).not.toContain('data-result="correct"');
    expect(shown).toContain('data-result="correct"');
    expect(shown).toContain(review.feedback!.explanation);
    const missing = renderToStaticMarkup(
      <ExplanationModal {...props} feedback={undefined} revealAnswer={false} />,
    );
    expect(missing).toContain(
      "An explanation is not available for this question.",
    );
  });
  for (const catalogueTest of demoMockTests)
    it(
      catalogueTest.id +
        ": resolves every completed question by its original composite ID",
      () => {
        const attempt = finishDemoAttempt(
            createDemoAttempt(catalogueTest, "demo-attempt-all-review", 1000),
            2000,
          ),
          before = JSON.stringify(attempt),
          questions = demoExamQuestions(catalogueTest),
          reviews = completedDemoReviews(catalogueTest, attempt);
        expect(Object.keys(reviews)).toHaveLength(questions.length);
        for (const question of questions) {
          expect(reviews[question.id].question.id).toBe(question.id);
          expect(reviews[question.id].question.options).toEqual(
            question.options,
          );
          expect(reviews[question.id].feedback).toEqual(
            demoPracticeFeedback[question.sourceId],
          );
        }
        expect(JSON.stringify(attempt)).toBe(before);
      },
    );
  it("does not substitute current content when a captured question revision differs", () => {
    const attempt = finishDemoAttempt(
      createDemoAttempt(test, "demo-attempt-revision", 1000),
      2000,
    );
    attempt.analytics!.questions[0].sourceRevision = "different";
    const reviews = completedDemoReviews(test, attempt);
    expect(reviews[qs[0].id]).toBeUndefined();
    expect(Object.keys(reviews)).toHaveLength(59);
  });
  it("shows missing historical content in the actual explanation component without fake options or enabled reveal", () => {
    const html = renderToStaticMarkup(
      <ExplanationModal
        open={false}
        onClose={() => {}}
        question={undefined}
        unavailableQuestion={{
          id: "historical-q-41",
          number: 41,
          section: "Mathematics",
        }}
        index={0}
        total={20}
        response={{
          selected: null,
          checked: false,
          saved: false,
          attempts: [],
        }}
        feedback={undefined}
        revealAnswer={false}
        onReveal={() => {}}
        onSave={() => {}}
        onNavigate={() => {}}
      />,
    );
    expect(html).toContain("explanation-dialog");
    expect(html).toContain("The original question content is unavailable");
    expect(html).toContain("historical-q-41");
    expect(html).not.toContain("answer-option");
    expect(html).toMatch(/role="switch"[^>]*disabled/);
    expect(html).not.toContain("results-modal");
  });
});
