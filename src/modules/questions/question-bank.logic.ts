import type {
  BankFilters,
  QuestionSource,
  QuestionSummary,
} from "./question-bank.types";
export const defaultFilters: BankFilters = {
  statuses: [],
  difficulties: [],
  sources: ["tsa-oxford"],
  yearsBySource: {},
  savedOnly: false,
};
export function availableYears(sources: QuestionSource[], selected: string[]) {
  return [
    ...new Set(
      sources
        .filter((source) => !selected.length || selected.includes(source.id))
        .flatMap((source) => source.years ?? []),
    ),
  ].sort((a, b) => b - a);
}
export function reconcileFilters(
  filters: BankFilters,
  sources: QuestionSource[],
): BankFilters {
  const yearsBySource: Record<string, number[]> = {};
  for (const source of sources) {
    if (source.years && filters.yearsBySource[source.id])
      yearsBySource[source.id] = filters.yearsBySource[source.id].filter(
        (year) => source.years!.includes(year),
      );
  }
  return { ...filters, yearsBySource };
}
export function applySourceYears(
  filters: BankFilters,
  source: QuestionSource,
  years: number[],
): BankFilters {
  const validYears = source.years
    ? [...new Set(years.filter((year) => source.years!.includes(year)))]
    : [];
  return {
    ...filters,
    sources: [source.id],
    yearsBySource: { ...filters.yearsBySource, [source.id]: validYears },
  };
}
export function filterQuestions(
  questions: QuestionSummary[],
  filters: BankFilters,
) {
  return questions.filter((question) => {
    const years = filters.yearsBySource[question.source] ?? [];
    return (
      (!filters.statuses.length ||
        filters.statuses.includes(question.status)) &&
      (!filters.difficulties.length ||
        filters.difficulties.includes(question.difficulty)) &&
      (!filters.sources.length || filters.sources.includes(question.source)) &&
      (!years.length ||
        question.year === null ||
        years.includes(question.year)) &&
      (!filters.savedOnly || question.saved)
    );
  });
}
export function summarize(questions: QuestionSummary[]) {
  const answered = questions.filter(
    (question) => question.status !== "unanswered",
  ).length;
  const correct = questions.filter(
    (question) => question.status === "correct",
  ).length;
  return {
    total: questions.length,
    answered,
    correct,
    accuracy: answered ? Math.round((correct / answered) * 100) : null,
  };
}
export function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
