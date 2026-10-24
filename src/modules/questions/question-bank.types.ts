/** Frontend view models only; not the educational-content import contract. */
export type QuestionStatus = "correct" | "partial" | "wrong" | "unanswered";
export type Difficulty = "easy" | "medium" | "hard";
export interface Topic {
  id: string;
  name: string;
}
export interface Subject {
  id: string;
  name: string;
  topics: Topic[];
}
export interface QuestionSource {
  id: string;
  label: string;
  /** Temporary availability configuration. null means this source is not year-based. */
  years: number[] | null;
}
export interface QuestionSummary {
  id: string;
  topicId: string;
  source: string;
  year: number | null;
  difficulty: Difficulty;
  status: QuestionStatus;
  saved: boolean;
}
export interface QuestionBankData {
  profile: { name: string; initials: string; plan: string };
  telegramUrl: string | null;
  sources: QuestionSource[];
  subjects: Subject[];
  questions: QuestionSummary[];
}
export interface BankFilters {
  statuses: QuestionStatus[];
  difficulties: Difficulty[];
  sources: string[];
  yearsBySource: Record<string, number[]>;
  savedOnly: boolean;
}
