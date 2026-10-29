import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { demoMockTests } from "./mock-tests.fixtures";
import {
  demoPracticeQuestions,
  demoPracticeFeedback,
} from "../questions/practice.fixtures";
import {
  changeDemoAttempt,
  createDemoAttempt,
  demoAttemptResult,
  demoExamQuestions,
  demoResultsHref,
  elapsedSeconds,
  examSections,
  finishDemoAttempt,
  validateDemoAttempt,
} from "./mock-test-attempt.logic";
import { readDemoAttempts, saveDemoAttempt } from "./mock-test-attempt.storage";
import { MockTestTaking, MockQuestionNavigator } from "./mock-test-taking";
import { mockResultModel } from "./mock-test-results.logic";
import { summarizeMockTests } from "./mock-tests.logic";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
const full = demoMockTests[0];
const questions = demoExamQuestions(full);
const initial = () => createDemoAttempt(full, "demo-attempt-test", 1000);
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    key: (i) => [...data.keys()][i] ?? null,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
    clear: () => data.clear(),
  };
}
describe("Mock Test demo attempts", () => {
  for (const test of demoMockTests)
    it(`${test.id}: preserves configuration, independent identities and local numbering`, () => {
      const qs = demoExamQuestions(test);
      expect(qs).toHaveLength(test.questionCount);
      expect(new Set(qs.map((q) => q.id)).size).toBe(test.questionCount);
      expect(qs[0].examSection).toBe(
        test.type === "crit-ps" ? "crit-ps" : "math",
      );
      for (const section of examSections(test))
        expect(
          qs.filter((q) => q.examSection === section).map((q) => q.localNumber),
        ).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
      qs.forEach((q) =>
        expect(q.prompt).toEqual(
          demoPracticeQuestions.find((source) => source.id === q.sourceId)!
            .prompt,
        ),
      );
    });
  it("enforces sequential section completion, locks finished sections, and persists answers and flags without evaluating", () => {
    let a = initial();
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[0].id,
      option: "B",
    });
    a = changeDemoAttempt(a, questions, { kind: "flag", id: questions[0].id });
    expect(
      changeDemoAttempt(a, questions, {
        kind: "navigate",
        id: questions[30].id,
      }),
    ).toBe(a);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "answer",
        id: questions[30].id,
        option: "D",
      }),
    ).toBe(a);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "flag",
        id: questions[30].id,
      }),
    ).toBe(a);
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[0].id,
      option: null,
    });
    expect(a.answers[questions[0].id]).toBeUndefined();
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[0].id,
      option: "B",
    });
    a = changeDemoAttempt(a, questions, { kind: "finish-section" });
    expect(a.completedSections).toEqual(["math"]);
    expect(a.currentId).toBe(questions[30].id);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "navigate",
        id: questions[0].id,
      }),
    ).toBe(a);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "answer",
        id: questions[0].id,
        option: "A",
      }),
    ).toBe(a);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "flag",
        id: questions[0].id,
      }),
    ).toBe(a);
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[30].id,
      option: "D",
    });
    expect(a.answers[questions[0].id]).toBe("B");
    expect(a.answers[questions[30].id]).toBe("D");
    expect(a.flags).toEqual([questions[0].id]);
    expect(a.sectionPositions).toEqual({
      math: questions[0].id,
      "crit-ps": questions[30].id,
    });
    expect(demoAttemptResult(full, a)).toBeNull();
    expect(changeDemoAttempt(a, questions, { kind: "finish-section" })).toBe(a);
  });
  it("does not accept foreign question or option IDs", () => {
    const a = initial();
    expect(
      changeDemoAttempt(a, questions, {
        kind: "answer",
        id: "other",
        option: "A",
      }),
    ).toBe(a);
    expect(
      changeDemoAttempt(a, questions, {
        kind: "answer",
        id: questions[0].id,
        option: "Z",
      }),
    ).toBe(a);
  });
  it("save/reload restores progress and isolates test/attempt identities", () => {
    const storage = memoryStorage();
    let a = initial();
    a = changeDemoAttempt(a, questions, { kind: "finish-section" });
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[31].id,
      option: "E",
    });
    a = changeDemoAttempt(a, questions, {
      kind: "navigate",
      id: questions[31].id,
    });
    a = changeDemoAttempt(a, questions, { kind: "flag", id: questions[31].id });
    saveDemoAttempt(a, storage);
    expect(readDemoAttempts(full, storage)).toEqual([a]);
    expect(readDemoAttempts(demoMockTests[1], storage)).toEqual([]);
    expect(elapsedSeconds(a, 61000)).toBe(60);
  });
  it("retake has independent state and cannot overwrite completed history", () => {
    const storage = memoryStorage();
    const done = finishDemoAttempt(initial(), 61000);
    saveDemoAttempt(done, storage);
    const retake = createDemoAttempt(full, "demo-attempt-retake", 62000);
    saveDemoAttempt(retake, storage);
    expect(readDemoAttempts(full, storage)).toEqual([retake, done]);
    expect(retake.answers).toEqual({});
    expect(() => saveDemoAttempt(initial(), storage)).toThrow(
      "already been finished",
    );
    expect(
      changeDemoAttempt(done, questions, { kind: "flag", id: questions[0].id }),
    ).toBe(done);
    expect(finishDemoAttempt(done, 90000)).toBe(done);
    expect(elapsedSeconds(done, 90000)).toBe(60);
  });
  it("evaluates only on Finish, counts omissions, and does not invent points", () => {
    let a = initial();
    const key = demoPracticeFeedback[questions[0].sourceId].correctOptionId;
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[0].id,
      option: key,
    });
    const wrong = questions[1].options.find(
      (o) =>
        o.id !== demoPracticeFeedback[questions[1].sourceId].correctOptionId,
    )!.id;
    a = changeDemoAttempt(a, questions, {
      kind: "answer",
      id: questions[1].id,
      option: wrong,
    });
    const result = demoAttemptResult(full, finishDemoAttempt(a, 61000))!;
    expect(result.result!.score).toBeNull();
    expect(mockResultModel(result)!.counts).toEqual({
      correct: 1,
      incorrect: 1,
      omitted: 58,
    });
    expect(mockResultModel(result)!.percentage(1)).toBe("1.7%");
    expect(result.result!.details!.sessionId).toBe(a.id);
    expect(summarizeMockTests([result]).average).toBeNull();
    expect(demoResultsHref(a)).toContain(a.id);
  });
  it("accepts an entirely omitted submission", () =>
    expect(
      mockResultModel(
        demoAttemptResult(full, finishDemoAttempt(initial(), 61000))!,
      )!.counts,
    ).toEqual({ correct: 0, incorrect: 0, omitted: 60 }));
  for (const invalid of [
    null,
    {},
    { version: 2 },
    { ...initial(), answers: { [questions[0].id]: "Z" } },
    { ...initial(), currentId: "foreign" },
    { ...initial(), currentId: questions[30].id },
    {
      ...initial(),
      completedSections: ["math"],
      currentId: questions[0].id,
    },
    { ...initial(), completedSections: ["foreign"] },
    { ...initial(), flags: ["foreign"] },
    { ...initial(), sectionPositions: { math: questions[30].id } },
    { ...initial(), completedAt: 500 },
  ])
    it(
      "rejects malformed saved state " + JSON.stringify(invalid).slice(0, 50),
      () => expect(validateDemoAttempt(invalid, full)).toBe(false),
    );
  it("validates current records and ignores corrupt storage", () => {
    expect(validateDemoAttempt(initial(), full)).toBe(true);
    expect(
      validateDemoAttempt(
        changeDemoAttempt(initial(), questions, { kind: "finish-section" }),
        full,
      ),
    ).toBe(true);
    const storage = memoryStorage();
    storage.setItem("justprepy:demo-mock:v1:" + full.id + ":bad", "{");
    expect(readDemoAttempts(full, storage)).toEqual([]);
  });
});
describe("Mock Test taking rendering", () => {
  it("has no practice-only checking, explanations, topic badges or correctness states", () => {
    const html = renderToStaticMarkup(
      <MockTestTaking test={full} initialAttempt={initial()} />,
    );
    expect(html).not.toContain("Explanation");
    expect(html).not.toContain(">Check<");
    expect(html).not.toContain("question-topic");
    expect(html).not.toContain("data-result=");
    expect(html).not.toContain("Pause");
    expect(html).toContain('role="timer"');
    expect(html).toContain("Mock Test #1");
    expect(html).toContain(
      '<span class="mock-section-name">Mathematics</span>',
    );
    expect(html).not.toContain('role="group" aria-label="Test section"');
    expect(html).toContain("three existing Critical Thinking");
    expect(html).not.toContain('class="button mock-finish"');
    expect(html).not.toContain("NUET Preparation");
  });
  for (const test of demoMockTests)
    it(`${test.type}: renders Finish Section or Finish Test on final question of active section`, () => {
      const qs = demoExamQuestions(test);
      const a = createDemoAttempt(test, "demo-attempt-finish", 1000);
      const firstHtml = renderToStaticMarkup(
        <MockTestTaking
          test={test}
          initialAttempt={{ ...a, currentId: qs[0].id }}
        />,
      );
      expect(firstHtml).not.toContain('class="button mock-finish"');
      expect(firstHtml).not.toContain('role="group" aria-label="Test section"');
      const endFirstSectionHtml = renderToStaticMarkup(
        <MockTestTaking
          test={test}
          initialAttempt={{ ...a, currentId: qs[29].id }}
        />,
      );
      expect(endFirstSectionHtml).toContain('class="button mock-finish"');
      if (test.type === "full") {
        expect(endFirstSectionHtml).toContain("<span>Finish Section</span>");
        expect(endFirstSectionHtml).not.toContain("<span>Finish Test</span>");
        const secondSectionAttempt = changeDemoAttempt(a, qs, {
          kind: "finish-section",
        });
        const endSecondSectionHtml = renderToStaticMarkup(
          <MockTestTaking
            test={test}
            initialAttempt={{ ...secondSectionAttempt, currentId: qs[59].id }}
          />,
        );
        expect(endSecondSectionHtml).toContain(
          '<span class="mock-section-name">Critical Thinking + Problem Solving</span>',
        );
        expect(endSecondSectionHtml).toContain('class="button mock-finish"');
        expect(endSecondSectionHtml).toContain("<span>Finish Test</span>");
      } else {
        expect(endFirstSectionHtml).toContain("<span>Finish Test</span>");
      }
    });
  it("navigator shows one section and independent answered/current/flag states", () => {
    const a = {
      ...initial(),
      answers: { [questions[0].id]: "A" },
      flags: [questions[0].id, questions[1].id],
    };
    const html = renderToStaticMarkup(
      <MockQuestionNavigator
        open={false}
        onClose={() => {}}
        onNavigate={() => {}}
        questions={questions.slice(0, 30)}
        attempt={a}
      />,
    );
    expect(html.match(/class="navigator-question"/g)).toHaveLength(30);
    expect(html).toContain("Question 1, answered, flagged, current question");
    expect(html).toContain("Question 2, unanswered, flagged");
    expect(html).not.toContain("Question 31");
    expect(html).not.toContain("Partly correct");
  });
});
