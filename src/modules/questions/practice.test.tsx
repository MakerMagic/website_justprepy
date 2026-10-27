import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PracticeAnswers } from "./practice-answers";
import { QuestionNavigator } from "./question-navigator";
import { ExplanationModal } from "./explanation-modal";
import { QuestionSolver } from "./question-solver";
import { demoQuestionBank } from "./question-bank.fixtures";
import {
  contentParts,
  latexMathML,
  PracticeContentView,
} from "./practice-content";
import {
  emptyPracticeResponse,
  checkPracticeResponse,
  navigatorTarget,
  optionResult,
  practiceResolved,
  practiceStatus,
  updatePracticeResponse,
} from "./practice.logic";
import {
  demoPracticeFeedback,
  demoPracticeQuestions,
} from "./practice.fixtures";

const question = demoPracticeQuestions[0];
const feedback = demoPracticeFeedback[question.id];

function checkedValues(html: string) {
  return (html.match(/<input\b[^>]*>/g) ?? [])
    .filter((input) => /\schecked(?:=|\s|\/?>)/.test(input))
    .map((input) => input.match(/\bvalue="([^"]*)"/)?.[1]);
}

function checkedResponse(choices: string[]) {
  let responses = updatePracticeResponse({}, question.id, {});
  for (const selected of choices) {
    responses = updatePracticeResponse(responses, question.id, { selected });
    responses = checkPracticeResponse(responses, question.id, feedback);
  }
  return responses[question.id];
}

describe("practice answer and navigation state", () => {
  it("does not release any correctness from selection alone", () => {
    const selected = { ...emptyPracticeResponse, selected: "A" };
    for (const option of question.options)
      expect(optionResult(option.id, selected, feedback)).toBeUndefined();
    expect(
      practiceStatus({ ...emptyPracticeResponse, selected: "A" }, feedback),
    ).toBe("unanswered");
  });
  it("marks only the checked selection and never reveals an unselected correct answer", () => {
    const failed = checkPracticeResponse(
      updatePracticeResponse({}, question.id, { selected: "A" }),
      question.id,
      feedback,
    )[question.id];
    expect(
      question.options.map((option) =>
        optionResult(option.id, failed, feedback),
      ),
    ).toEqual(["wrong", undefined, undefined, undefined, undefined]);
    const selected = { ...failed, selected: "C", checked: false };
    expect(optionResult("C", selected, feedback)).toBeUndefined();
    const confirmed = checkPracticeResponse(
      { [question.id]: selected },
      question.id,
      feedback,
    )[question.id];
    expect(optionResult("C", confirmed, feedback)).toBe("correct");
    expect(optionResult("A", confirmed, feedback)).toBe("wrong");
    expect(optionResult("B", failed, undefined)).toBeUndefined();
  });
  it("keeps main grading history-based while review reveals only the canonical answer", () => {
    const response = checkPracticeResponse(
      updatePracticeResponse({}, question.id, { selected: "A" }),
      question.id,
      feedback,
    )[question.id];
    expect(optionResult("C", response, feedback, true)).toBeUndefined();
    expect(optionResult("A", response, feedback, true)).toBe("wrong");
    expect(optionResult("A", response, feedback, false)).toBeUndefined();
    const html = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={response}
        feedback={feedback}
        revealed
        preview
      />,
    );
    expect(html).not.toContain('data-result="wrong"');
    expect(html.match(/data-result="correct"/g)).toHaveLength(1);
    expect(checkedValues(html)).toEqual(["C"]);
  });
  it("retains all wrong letters while selecting, reselecting and eventually confirming the correct answer", () => {
    let responses = updatePracticeResponse({}, question.id, { selected: "A" });
    responses = checkPracticeResponse(responses, question.id, feedback);
    responses = updatePracticeResponse(responses, question.id, {
      selected: "B",
    });
    expect(optionResult("A", responses[question.id], feedback)).toBe("wrong");
    expect(optionResult("B", responses[question.id], feedback)).toBeUndefined();
    responses = checkPracticeResponse(responses, question.id, feedback);
    responses = updatePracticeResponse(responses, question.id, {
      selected: "A",
    });
    expect(responses[question.id].checked).toBe(true);
    const beforeRecheck = responses;
    responses = checkPracticeResponse(responses, question.id, feedback);
    expect(responses).toBe(beforeRecheck);
    expect(responses[question.id].attempts).toEqual(["A", "B"]);
    const staleFlag = {
      ...responses,
      [question.id]: { ...responses[question.id], checked: false },
    };
    expect(checkPracticeResponse(staleFlag, question.id, feedback)).toBe(
      staleFlag,
    );
    responses = updatePracticeResponse(responses, question.id, {
      selected: "C",
    });
    const pendingHtml = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={responses[question.id]}
        feedback={feedback}
        revealed={false}
      />,
    );
    expect(pendingHtml.match(/data-result="wrong"/g)).toHaveLength(2);
    expect(pendingHtml).not.toContain('data-result="correct"');
    responses = checkPracticeResponse(responses, question.id, feedback);
    expect(responses[question.id].attempts).toEqual(["A", "B", "C"]);
    expect(
      question.options.map((option) =>
        optionResult(option.id, responses[question.id], feedback),
      ),
    ).toEqual(["wrong", "wrong", "correct", undefined, undefined]);
    expect(practiceStatus(responses[question.id], feedback)).toBe("partial");
    const solvedHtml = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={responses[question.id]}
        feedback={feedback}
        revealed
      />,
    );
    expect(solvedHtml.match(/data-result="wrong"/g)).toHaveLength(2);
    expect(solvedHtml.match(/data-result="correct"/g)).toHaveLength(1);
    const savedResponse = responses[question.id];
    responses = updatePracticeResponse(responses, "another-question", {
      selected: "D",
    });
    expect(responses[question.id]).toBe(savedResponse);
    expect(optionResult("A", responses[question.id], feedback)).toBe("wrong");
  });
  it("allows failed retries and resolves as partial only after a checked correct answer", () => {
    let responses = updatePracticeResponse({}, "first", { selected: "A" });
    responses = checkPracticeResponse(responses, "first", feedback);
    expect(practiceStatus(responses.first, feedback)).toBe("wrong");
    expect(practiceResolved(responses.first)).toBe(false);
    responses = updatePracticeResponse(responses, "first", { selected: "B" });
    expect(responses.first.checked).toBe(false);
    expect(practiceStatus(responses.first, feedback)).toBe("wrong");
    responses = checkPracticeResponse(responses, "first", feedback);
    responses = updatePracticeResponse(responses, "first", { selected: "C" });
    expect(practiceStatus(responses.first, feedback)).toBe("wrong");
    responses = checkPracticeResponse(responses, "first", feedback);
    expect(responses.first.attempts).toEqual(["A", "B", "C"]);
    expect(practiceStatus(responses.first, feedback)).toBe("partial");
    expect(practiceResolved(responses.first)).toBe(true);
  });
  it("keeps a resolved result immutable while saving and other questions remain independent", () => {
    let responses = updatePracticeResponse({}, "first", { selected: "C" });
    responses = checkPracticeResponse(responses, "first", feedback);
    responses = updatePracticeResponse(responses, "second", { selected: "B" });
    responses = updatePracticeResponse(responses, "first", {
      selected: "A",
      saved: true,
    });
    expect(responses.first).toMatchObject({
      selected: "C",
      checked: true,
      saved: true,
      attempts: ["C"],
      outcome: "correct",
    });
    expect(responses.second).toMatchObject({ selected: "B", checked: false });
  });
  it("counts only completed evaluations and does not recheck the same evaluated selection", () => {
    expect(checkPracticeResponse({}, "first", feedback)).toEqual({});
    const selected = updatePracticeResponse({}, "first", { selected: "A" });
    expect(checkPracticeResponse(selected, "first", undefined)).toBe(selected);
    const checked = checkPracticeResponse(selected, "first", feedback);
    expect(checkPracticeResponse(checked, "first", feedback)).toBe(checked);
    expect(checked.first.attempts).toEqual(["A"]);
    expect(selected.first.attempts).toEqual([]);
    const saved = updatePracticeResponse(checked, "first", { saved: true });
    expect(saved.first).toMatchObject({
      checked: true,
      outcome: "wrong",
      attempts: ["A"],
    });
  });
  it("keeps failed answer inputs enabled, but locks successfully resolved answers", () => {
    const selected = updatePracticeResponse({}, question.id, { selected: "A" });
    const failed = checkPracticeResponse(selected, question.id, feedback);
    const html = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={failed[question.id]}
        feedback={feedback}
        revealed
      />,
    );
    expect(html).not.toContain('disabled=""');
    expect(html).not.toContain('data-result="correct"');
    expect(html).not.toContain("Correct answer.");
    expect(html.match(/data-result="wrong"/g)).toHaveLength(1);
    const retry = updatePracticeResponse(failed, question.id, {
      selected: "C",
    });
    const solved = checkPracticeResponse(retry, question.id, feedback);
    const resolvedHtml = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={solved[question.id]}
        feedback={feedback}
        revealed
      />,
    );
    expect(resolvedHtml.match(/disabled=""/g)).toHaveLength(
      question.options.length,
    );
    const navigator = renderToStaticMarkup(
      <QuestionNavigator
        open={false}
        onClose={() => {}}
        questions={[question]}
        current={0}
        responses={solved}
        feedback={demoPracticeFeedback}
        onNavigate={() => {}}
      />,
    );
    expect(navigator).toContain(
      'aria-label="Question 1, partial, current question"',
    );
  });
  it("derives status from completed history rather than selection or a stale outcome cache", () => {
    expect(practiceStatus(undefined, feedback)).toBe("unanswered");
    expect(
      practiceStatus(
        {
          ...emptyPracticeResponse,
          selected: "C",
          checked: true,
          attempts: ["C"],
        },
        feedback,
      ),
    ).toBe("correct");
    expect(
      practiceStatus(
        {
          ...emptyPracticeResponse,
          selected: "C",
          checked: false,
          attempts: ["A"],
          outcome: "correct",
        },
        feedback,
      ),
    ).toBe("wrong");
    expect(
      practiceStatus(
        { ...emptyPracticeResponse, selected: "A", outcome: "partial" },
        feedback,
      ),
    ).toBe("unanswered");
    expect(
      practiceStatus(
        {
          ...emptyPracticeResponse,
          selected: "A",
          checked: true,
          outcome: "partial",
          attempts: ["A", "C"],
        },
        feedback,
      ),
    ).toBe("partial");
  });
  it("supports grid keyboard movement with variable counts and viewport columns", () => {
    expect(navigatorTarget(2, "ArrowRight", 3, 10)).toBe(2);
    expect(navigatorTarget(2, "ArrowDown", 37, 6)).toBe(8);
    expect(navigatorTarget(1, "ArrowUp", 37, 6)).toBe(0);
    expect(navigatorTarget(1, "End", 65, 10)).toBe(64);
    expect(navigatorTarget(8, "Home", 37, 6)).toBe(0);
    expect(navigatorTarget(1, "Tab", 3, 6)).toBeNull();
  });
  it("isolates a review reveal from the original answer state", () => {
    const response = checkPracticeResponse(
      updatePracticeResponse({}, question.id, { selected: "A" }),
      question.id,
      feedback,
    )[question.id];
    const beforeReview = JSON.stringify(response);
    const main = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={response}
        feedback={feedback}
        revealed={false}
      />,
    );
    const review = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={response}
        feedback={feedback}
        revealed
        preview
      />,
    );
    expect(main).not.toContain('data-result="correct"');
    expect(main).toContain('data-result="wrong"');
    expect(review.match(/data-result="correct"/g)).toHaveLength(1);
    expect(review).not.toContain('data-result="wrong"');
    expect(response.checked).toBe(true);
    expect(JSON.stringify(response)).toBe(beforeReview);
    expect(review).toContain('<span class="sr-only"> Correct answer.</span>');
    expect(review).not.toContain('class="answer-state"');
  });
  it("keeps every review option fully neutral with Show Answer off, even after a failed check", () => {
    const failed = checkPracticeResponse(
      updatePracticeResponse({}, question.id, { selected: "A" }),
      question.id,
      feedback,
    );
    const html = renderToStaticMarkup(
      <PracticeAnswers
        question={question}
        response={failed[question.id]}
        feedback={feedback}
        revealed={false}
        preview
      />,
    );
    expect(html).not.toContain("data-result=");
    expect(html).not.toContain('data-selected="true"');
    expect(html).not.toContain('checked=""');
    expect(html).not.toContain("Correct answer.");
    expect(failed[question.id].outcome).toBe("wrong");
  });
});

describe("shared question and explanation content rendering", () => {
  it("renders unanswered question content and explanation independently of reveal or attempts", () => {
    const response = { ...emptyPracticeResponse, attempts: [] };
    const before = JSON.stringify(response);
    for (const revealAnswer of [false, true, false]) {
      const html = renderToStaticMarkup(
        <ExplanationModal
          open={false}
          onClose={() => {}}
          question={question}
          index={0}
          total={1}
          response={response}
          feedback={feedback}
          revealAnswer={revealAnswer}
          onReveal={() => {}}
          onNavigate={() => {}}
          onSave={() => {}}
        />,
      );
      expect(html).toContain(question.prompt);
      expect(html).toContain(feedback.explanation);
      expect(html).toContain('class="review-number" data-state="unanswered"');
      expect(html.match(/data-result="correct"/g) ?? []).toHaveLength(
        revealAnswer ? 1 : 0,
      );
      expect(html).not.toContain('data-result="wrong"');
      expect(html).not.toContain('data-selected="true"');
    }
    expect(JSON.stringify(response)).toBe(before);
    expect(practiceStatus(response, feedback)).toBe("unanswered");
  });
  it("uses canonical correct-option identities across questions regardless of selection or attempt history", () => {
    for (const item of demoPracticeQuestions) {
      const itemFeedback = demoPracticeFeedback[item.id];
      const wrong = item.options
        .filter((option) => option.id !== itemFeedback.correctOptionId)
        .slice(0, 2)
        .map((option) => option.id);
      let responses = updatePracticeResponse({}, item.id, {});
      for (const selected of wrong) {
        responses = updatePracticeResponse(responses, item.id, { selected });
        responses = checkPracticeResponse(responses, item.id, itemFeedback);
      }
      const response = responses[item.id];
      const before = JSON.stringify(response);
      const html = renderToStaticMarkup(
        <PracticeAnswers
          question={item}
          response={response}
          feedback={itemFeedback}
          revealed
          preview
        />,
      );
      expect(html.match(/data-result="correct"/g)).toHaveLength(1);
      expect(html).not.toContain('data-result="wrong"');
      expect(checkedValues(html)).toEqual([itemFeedback.correctOptionId]);
      expect(JSON.stringify(response)).toBe(before);
    }
  });
  it("shares all four performance statuses with Navigator without coupling them to answer reveal", () => {
    const cases = [
      [checkedResponse([]), "unanswered"],
      [checkedResponse(["A", "B"]), "wrong"],
      [checkedResponse(["C"]), "correct"],
      [checkedResponse(["A", "C"]), "partial"],
    ] as const;
    for (const [response, expected] of cases) {
      const before = JSON.stringify(response);
      const navigator = renderToStaticMarkup(
        <QuestionNavigator
          open={false}
          onClose={() => {}}
          questions={[question]}
          current={0}
          responses={{ [question.id]: response }}
          feedback={demoPracticeFeedback}
          onNavigate={() => {}}
        />,
      );
      expect(navigator).toContain(
        'aria-label="Question 1, ' + expected + ', current question"',
      );
      for (const revealAnswer of [false, true]) {
        const html = renderToStaticMarkup(
          <ExplanationModal
            open={false}
            onClose={() => {}}
            question={question}
            index={0}
            total={1}
            response={response}
            feedback={feedback}
            revealAnswer={revealAnswer}
            onReveal={() => {}}
            onNavigate={() => {}}
            onSave={() => {}}
          />,
        );
        expect(html).toContain(
          'class="review-number" data-state="' + expected + '"',
        );
        expect(html.match(/data-result="correct"/g) ?? []).toHaveLength(
          revealAnswer ? 1 : 0,
        );
        expect(html).not.toContain('data-result="wrong"');
        expect(html).toContain(
          'class="review-section">Critical Thinking</span>',
        );
        expect(html).toContain(
          'class="review-difficulty" data-state="medium">medium difficulty</span>',
        );
      }
      expect(JSON.stringify(response)).toBe(before);
    }
  });
  it("displays the current stable demo ID outside the inner explanation card, without an ID prefix", () => {
    for (const item of demoPracticeQuestions) {
      const html = renderToStaticMarkup(
        <ExplanationModal
          open={false}
          onClose={() => {}}
          question={item}
          index={0}
          total={demoPracticeQuestions.length}
          response={emptyPracticeResponse}
          feedback={demoPracticeFeedback[item.id]}
          revealAnswer={false}
          onReveal={() => {}}
          onNavigate={() => {}}
          onSave={() => {}}
        />,
      );
      expect(html).toContain(
        '</div><p class="review-question-id">' + item.id + "</p></section>",
      );
      expect(html).not.toContain("ID:");
      expect(html).toContain(demoPracticeFeedback[item.id].explanation);
    }
  });
  it("builds navigator numbers from the supplied session length", () => {
    for (const count of [3, 37]) {
      const questions = Array.from({ length: count }, (_, index) => ({
        ...question,
        id: "test-" + index,
      }));
      const html = renderToStaticMarkup(
        <QuestionNavigator
          open={false}
          onClose={() => {}}
          questions={questions}
          current={count - 1}
          responses={{}}
          feedback={{}}
          onNavigate={() => {}}
        />,
      );
      expect(html.match(/aria-label="Question \d+,/g)).toHaveLength(count);
      expect(html).toContain(
        "Question " + count + ", unanswered, current question",
      );
    }
  });
  it("supports passage-free review and unavailable explanations without fabricated metadata", () => {
    const html = renderToStaticMarkup(
      <ExplanationModal
        open={false}
        onClose={() => {}}
        question={{
          ...question,
          passage: [],
          section: undefined,
          source: undefined,
          difficulty: undefined,
        }}
        index={0}
        total={1}
        response={emptyPracticeResponse}
        feedback={undefined}
        revealAnswer={false}
        onReveal={() => {}}
        onNavigate={() => {}}
        onSave={() => {}}
      />,
    );
    expect(html).toContain(
      "An explanation is not available for this question.",
    );
    expect(html).not.toContain("Psychologists have observed");
    expect(html).not.toContain("Critical Thinking");
  });
  it("preserves text order and inline/display math intent", () => {
    const parts = contentParts("Let $x^2$ equal \\(4\\).\n\n$$x=2$$");
    expect(
      parts.filter((part) => part.type === "math").map((part) => part.display),
    ).toEqual([false, false, true]);
    const html = renderToStaticMarkup(
      <PracticeContentView content="Let $x^2$ equal \(4\)." />,
    );
    expect(html).toContain("<math");
    expect(html).toContain("<msup>");
  });
  it("renders fractions and structured derivations as native MathML", () => {
    expect(latexMathML("\\frac{a}{b}")).toContain("<mfrac>");
    expect(
      latexMathML("\\begin{aligned}x+1&=3\\\\x&=2\\end{aligned}", true),
    ).toContain("<mtable");
  });
  it("rejects invalid and unsafe math without displaying raw LaTeX", () => {
    expect(latexMathML("\\frac{")).toBeNull();
    expect(latexMathML("\\href{javascript:alert(1)}{click}")).toBeNull();
    const html = renderToStaticMarkup(
      <PracticeContentView
        content={[{ type: "math", latex: "\\notACommand" }]}
      />,
    );
    expect(html).toContain("Mathematical expression unavailable.");
    expect(html).not.toContain("notACommand");
  });
  it("escapes ordinary source text rather than interpreting HTML", () => {
    const html = renderToStaticMarkup(
      <PracticeContentView content="<script>alert(1)</script>" />,
    );
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
  it("preserves genuine asset dimensions, alt text and safe image sources", () => {
    const html = renderToStaticMarkup(
      <PracticeContentView
        content={[
          {
            type: "image",
            src: "/brand/justprepy-mark.svg",
            alt: "Supplied mark",
            width: 98,
            height: 86,
          },
        ]}
      />,
    );
    expect(html).toContain('width="98"');
    expect(html).toContain('height="86"');
    expect(html).toContain('alt="Supplied mark"');
    const invalid = renderToStaticMarkup(
      <PracticeContentView
        content={[
          {
            type: "image",
            src: "javascript:alert(1)",
            alt: "",
            width: 98,
            height: 86,
          },
        ]}
      />,
    );
    expect(invalid).toContain("Image unavailable.");
    expect(invalid).not.toContain("<img");
  });
  it("keeps fixture feedback attached to real option identities", () => {
    for (const item of demoPracticeQuestions) {
      expect(
        item.options.some(
          (option) =>
            option.id === demoPracticeFeedback[item.id].correctOptionId,
        ),
      ).toBe(true);
    }
  });
});

describe("focused question practice layout", () => {
  it("retains practice controls and the exit link without rendering the application navigation", () => {
    const html = renderToStaticMarkup(
      <QuestionSolver
        questions={demoPracticeQuestions}
        feedback={demoPracticeFeedback}
        profile={demoQuestionBank.profile}
        telegramUrl={demoQuestionBank.telegramUrl}
      />,
    );
    expect(html).toContain('class="solver-content"');
    expect(html).toContain('href="#main-content">Skip to question');
    expect(html).toContain(
      'aria-label="Exit practice and return to Question Bank"',
    );
    expect(html).toContain('aria-label="Pause practice timer"');
    expect(html).toContain('aria-label="Question navigation"');
    expect(html).toContain('aria-label="Question actions"');
    expect(html).toContain('class="answer-options"');
    expect(html).not.toContain('class="sidebar"');
    expect(html).not.toContain('class="workspace"');
    expect(html).not.toContain('class="workspace-header"');
    expect(html).not.toContain("NUET Preparation");
    expect(html).not.toContain("Join Our Telegram Channel");
  });
  it("keeps the empty-practice return action available without introducing navigation", () => {
    const html = renderToStaticMarkup(
      <QuestionSolver
        questions={[]}
        feedback={{}}
        profile={demoQuestionBank.profile}
        telegramUrl={null}
      />,
    );
    expect(html).toContain("No questions available");
    expect(html).toContain('href="/"');
    expect(html).toContain("Back to Question Bank");
    expect(html).not.toContain('class="sidebar"');
    expect(html).not.toContain('class="workspace-header"');
  });
});
