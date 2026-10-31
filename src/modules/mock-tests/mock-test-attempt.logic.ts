import type { PracticeQuestion } from "../questions/practice.types";
import {
  demoPracticeQuestions,
  demoPracticeFeedback,
} from "../questions/practice.fixtures";
import type { MockTest } from "./mock-tests.types";

export type ExamSection = "math" | "crit-ps";
export const examSectionNames: Record<ExamSection, string> = {
  math: "Mathematics",
  "crit-ps": "Critical Thinking + Problem Solving",
};
export interface ExamQuestion extends PracticeQuestion {
  sourceId: string;
  examSection: ExamSection;
  localNumber: number;
}
/** Single local demo identity; never an authenticated user ID. */
export const DEMO_ATTEMPT_OWNER = "local-demo-profile";
export interface AttemptQuestionMetadata {
  id: string;
  sourceId: string;
  sourceRevision: string;
  section: ExamSection;
  subject: "ct" | "ps" | "m";
  topic: string | null;
}
export interface AttemptAnalyticsCapture {
  version: 1;
  ownerId: string;
  configuration: MockTest["type"];
  test?: Pick<
    MockTest,
    | "title"
    | "type"
    | "subjects"
    | "durationMinutes"
    | "questionCount"
    | "maxScore"
  >;
  questions: AttemptQuestionMetadata[];
  questionTimeMs: Record<string, number>;
  observedThrough?: number;
  /** Frozen evaluation from the existing demo assessment, not a second scoring implementation. */
  result?: NonNullable<MockTest["result"]>;
}
function sourceRevision(question: ExamQuestion) {
  const value = JSON.stringify([
    question.prompt,
    question.passage,
    question.options,
    demoPracticeFeedback[question.sourceId],
  ]);
  let hash = 2166136261;
  for (const character of value)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0).toString(16);
}
export function attemptQuestionMetadata(
  question: ExamQuestion,
): AttemptQuestionMetadata {
  const subject =
    question.examSection === "math"
      ? "m"
      : question.section === "Problem Solving"
        ? "ps"
        : "ct";
  const sourceMatches =
    question.section ===
    (subject === "m"
      ? "Mathematics"
      : subject === "ps"
        ? "Problem Solving"
        : "Critical Thinking");
  return {
    id: question.id,
    sourceId: question.sourceId,
    sourceRevision: sourceRevision(question),
    section: question.examSection,
    subject,
    topic: sourceMatches ? question.topic : null,
  };
}
export interface DemoMockAttempt {
  version: 1;
  id: string;
  testId: string;
  startedAt: number;
  completedAt: number | null;
  currentId: string;
  completedSections?: ExamSection[];
  sectionPositions: Partial<Record<ExamSection, string>>;
  answers: Record<string, string>;
  flags: string[];
  analytics?: AttemptAnalyticsCapture;
}
export function examSections(test: MockTest): ExamSection[] {
  return test.type === "full" ? ["math", "crit-ps"] : [test.type];
}
export function activeExamSection(
  attempt: Pick<DemoMockAttempt, "completedSections">,
  sections: readonly ExamSection[],
): ExamSection {
  const completed = attempt.completedSections ?? [];
  return (
    sections.find((section) => !completed.includes(section)) ??
    sections[sections.length - 1]
  );
}
function orderedAttemptSections(
  questions: readonly ExamQuestion[],
): ExamSection[] {
  const seen: ExamSection[] = [];
  for (const question of questions) {
    if (!seen.includes(question.examSection)) seen.push(question.examSection);
  }
  return seen;
}
/** Owner-approved demo: repeat existing authored practice examples, never fabricate exam content.
 * These are layout slots, including Mathematics, NOT subject-matched published questions.
 */
export function demoExamQuestions(test: MockTest): ExamQuestion[] {
  const offset = [...test.id].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return examSections(test).flatMap((examSection) =>
    Array.from({ length: 30 }, (_, index) => {
      const source =
        demoPracticeQuestions[(index + offset) % demoPracticeQuestions.length];
      return {
        ...source,
        id: `${test.id}:${examSection}:${index + 1}:${source.id}`,
        sourceId: source.id,
        examSection,
        localNumber: index + 1,
      };
    }),
  );
}
export function createDemoAttempt(
  test: MockTest,
  id: string,
  now: number,
): DemoMockAttempt {
  const first = demoExamQuestions(test)[0];
  return {
    version: 1,
    id,
    testId: test.id,
    startedAt: now,
    completedAt: null,
    currentId: first.id,
    completedSections: [],
    sectionPositions: { [first.examSection]: first.id },
    answers: {},
    flags: [],
    analytics: {
      version: 1,
      ownerId: DEMO_ATTEMPT_OWNER,
      configuration: test.type,
      test: {
        title: test.title,
        type: test.type,
        subjects: { ...test.subjects },
        durationMinutes: test.durationMinutes,
        questionCount: test.questionCount,
        maxScore: test.maxScore,
      },
      questions: demoExamQuestions(test).map(attemptQuestionMetadata),
      questionTimeMs: {},
    },
  };
}
export type AttemptChange =
  | { kind: "navigate"; id: string }
  | { kind: "answer"; id: string; option: string | null }
  | { kind: "flag"; id: string }
  | { kind: "finish-section" };
export function changeDemoAttempt(
  attempt: DemoMockAttempt,
  questions: ExamQuestion[],
  change: AttemptChange,
): DemoMockAttempt {
  if (attempt.completedAt !== null || !questions.length) return attempt;
  const sections = orderedAttemptSections(questions);
  const completedSections = attempt.completedSections ?? [];
  const activeSection = activeExamSection({ completedSections }, sections);
  if (change.kind === "finish-section") {
    const activeIndex = sections.indexOf(activeSection);
    if (activeIndex < 0 || activeIndex >= sections.length - 1) return attempt;
    const nextSection = sections[activeIndex + 1];
    const nextQuestion = questions.find((q) => q.examSection === nextSection);
    if (!nextQuestion) return attempt;
    const nextId = attempt.sectionPositions[nextSection] ?? nextQuestion.id;
    return {
      ...attempt,
      completedSections: [...completedSections, activeSection],
      currentId: nextId,
      sectionPositions: {
        ...attempt.sectionPositions,
        [nextSection]: nextId,
      },
    };
  }
  const question = questions.find((q) => q.id === change.id);
  if (!question || question.examSection !== activeSection) return attempt;
  if (change.kind === "navigate")
    return {
      ...attempt,
      currentId: question.id,
      sectionPositions: {
        ...attempt.sectionPositions,
        [question.examSection]: question.id,
      },
    };
  if (change.kind === "flag")
    return {
      ...attempt,
      flags: attempt.flags.includes(question.id)
        ? attempt.flags.filter((id) => id !== question.id)
        : [...attempt.flags, question.id],
    };
  if (
    change.option !== null &&
    !question.options.some((o) => o.id === change.option)
  )
    return attempt;
  const answers = { ...attempt.answers };
  if (change.option === null) delete answers[question.id];
  else answers[question.id] = change.option;
  return { ...attempt, answers };
}
export function attemptDeadline(
  test: Pick<MockTest, "durationMinutes">,
  attempt: Pick<DemoMockAttempt, "startedAt"> &
    Partial<Pick<DemoMockAttempt, "analytics">>,
) {
  return (
    attempt.startedAt +
    (attempt.analytics?.test?.durationMinutes ?? test.durationMinutes) * 60_000
  );
}
export function attemptExpired(
  test: Pick<MockTest, "durationMinutes">,
  attempt: Pick<DemoMockAttempt, "startedAt" | "completedAt"> &
    Partial<Pick<DemoMockAttempt, "analytics">>,
  now: number,
) {
  return attempt.completedAt === null && now >= attemptDeadline(test, attempt);
}
export function elapsedSeconds(attempt: DemoMockAttempt, now: number) {
  return Math.max(
    0,
    Math.floor(((attempt.completedAt ?? now) - attempt.startedAt) / 1000),
  );
}
export function finishDemoAttempt(
  attempt: DemoMockAttempt,
  now: number,
): DemoMockAttempt {
  return attempt.completedAt !== null
    ? attempt
    : { ...attempt, completedAt: Math.max(now, attempt.startedAt) };
}
/** Evaluate authored DEMO keys only after completion. No NUET points formula exists. */
export function demoAttemptResult(
  test: MockTest,
  attempt: DemoMockAttempt,
): MockTest | null {
  if (attempt.completedAt === null || attempt.testId !== test.id) return null;
  if (attempt.analytics?.result)
    return {
      ...test,
      ...attempt.analytics.test,
      result: attempt.analytics.result,
    };
  return {
    ...test,
    result: {
      score: null,
      completedAt: new Date(attempt.completedAt).toISOString(),
      details: {
        sessionId: attempt.id,
        timeSpentMinutes:
          Math.round(elapsedSeconds(attempt, attempt.completedAt) / 6) / 10,
        sections: [],
        questions: demoExamQuestions(test).map((question, index) => ({
          id: question.id,
          number: index + 1,
          section: question.examSection === "math" ? "m" : "ct",
          status: !attempt.answers[question.id]
            ? "omitted"
            : attempt.answers[question.id] ===
                demoPracticeFeedback[question.sourceId]?.correctOptionId
              ? "correct"
              : "incorrect",
        })),
      },
    },
  };
}
export function validateDemoAttempt(
  value: unknown,
  test: MockTest,
): value is DemoMockAttempt {
  if (!value || typeof value !== "object") return false;
  const a = value as DemoMockAttempt;
  const questions = demoExamQuestions(test);
  const sections = examSections(test);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const completedSections = a.completedSections ?? [];
  const validCompletedSections =
    (a.completedSections === undefined || Array.isArray(a.completedSections)) &&
    completedSections.length < sections.length &&
    completedSections.every((section, index) => sections[index] === section);
  if (!validCompletedSections) return false;
  if (a.analytics !== undefined) {
    const capture = a.analytics;
    if (
      !capture ||
      capture.version !== 1 ||
      typeof capture.ownerId !== "string" ||
      !capture.ownerId ||
      capture.configuration !== test.type ||
      (capture.test !== undefined &&
        (!capture.test ||
          capture.test.type !== capture.configuration ||
          typeof capture.test.title !== "string" ||
          !Number.isFinite(capture.test.maxScore) ||
          capture.test.maxScore <= 0 ||
          !Number.isFinite(capture.test.durationMinutes) ||
          capture.test.durationMinutes <= 0 ||
          capture.test.questionCount !== questions.length ||
          !capture.test.subjects ||
          ![
            capture.test.subjects.criticalThinking,
            capture.test.subjects.problemSolving,
            capture.test.subjects.mathematics,
          ].every(
            (v) => v === null || ["easy", "medium", "hard"].includes(v),
          ))) ||
      !Array.isArray(capture.questions) ||
      capture.questions.length !== questions.length ||
      new Set(capture.questions.map((q) => q.id)).size !== questions.length ||
      !capture.questions.every(
        (q) =>
          q &&
          byId.has(q.id) &&
          q.sourceId === byId.get(q.id)?.sourceId &&
          q.section === byId.get(q.id)?.examSection &&
          ["ct", "ps", "m"].includes(q.subject) &&
          typeof q.sourceRevision === "string" &&
          (q.topic === null || typeof q.topic === "string"),
      ) ||
      (capture.observedThrough !== undefined &&
        (!Number.isFinite(capture.observedThrough) ||
          capture.observedThrough < a.startedAt)) ||
      !capture.questionTimeMs ||
      typeof capture.questionTimeMs !== "object" ||
      Array.isArray(capture.questionTimeMs) ||
      !Object.entries(capture.questionTimeMs).every(
        ([id, ms]) =>
          byId.has(id) &&
          Number.isFinite(ms) &&
          ms >= 0 &&
          ms <= test.durationMinutes * 60000,
      )
    )
      return false;
    if (capture.result !== undefined) {
      const result = capture.result,
        rows = result?.details?.questions;
      if (
        a.completedAt === null ||
        !result ||
        result.completedAt !== new Date(a.completedAt).toISOString() ||
        result.details?.sessionId !== a.id ||
        !(
          result.score === null ||
          (Number.isFinite(result.score) &&
            result.score >= 0 &&
            result.score <= test.maxScore)
        ) ||
        !Array.isArray(rows) ||
        rows.length !== questions.length ||
        new Set(rows.map((q) => q.id)).size !== questions.length ||
        !rows.every(
          (q) =>
            byId.has(q.id) &&
            ["correct", "incorrect", "omitted"].includes(q.status),
        )
      )
        return false;
    }
  }
  const activeSection = activeExamSection({ completedSections }, sections);
  return (
    a.version === 1 &&
    typeof a.id === "string" &&
    /^demo-attempt-[a-z0-9-]+$/.test(a.id) &&
    a.testId === test.id &&
    Number.isFinite(a.startedAt) &&
    a.startedAt > 0 &&
    (a.completedAt === null ||
      (Number.isFinite(a.completedAt) && a.completedAt >= a.startedAt)) &&
    byId.has(a.currentId) &&
    (a.completedAt !== null ||
      byId.get(a.currentId)?.examSection === activeSection) &&
    Array.isArray(a.flags) &&
    a.flags.every((id) => typeof id === "string" && byId.has(id)) &&
    new Set(a.flags).size === a.flags.length &&
    !!a.answers &&
    typeof a.answers === "object" &&
    !Array.isArray(a.answers) &&
    Object.entries(a.answers).every(([id, option]) =>
      byId.get(id)?.options.some((o) => o.id === option),
    ) &&
    !!a.sectionPositions &&
    typeof a.sectionPositions === "object" &&
    !Array.isArray(a.sectionPositions) &&
    Object.entries(a.sectionPositions).every(
      ([section, id]) => byId.get(id)?.examSection === section,
    )
  );
}
export const demoResultsHref = (attempt: DemoMockAttempt) =>
  `/mock-tests/${encodeURIComponent(attempt.testId)}/results?attempt=${encodeURIComponent(attempt.id)}`;
export const demoTakeHref = (testId: string, attemptId?: string) =>
  `/app/mock-tests/${encodeURIComponent(testId)}/take${attemptId ? "?attempt=" + encodeURIComponent(attemptId) : ""}`;
