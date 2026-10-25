import type { Difficulty } from "./question-bank.types";

/** Safe, serializable view content, not a publication/import schema. */
export type PracticeContent = string | PracticeContentPart[];
export type PracticeContentPart =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; display?: boolean }
  | {
      type: "image";
      src: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    };

/** Frontend demo view model; independent of the published educational-content contract. */
export interface PracticeQuestion {
  id: string;
  topic: string;
  passage: PracticeContent[];
  prompt: PracticeContent;
  options: { id: string; text: PracticeContent }[];
  difficulty?: Difficulty;
  section?: string;
  source?: string;
}

export interface PracticeResponse {
  selected: string | null;
  /** Whether the current selection has been evaluated, not whether the question is resolved. */
  checked: boolean;
  saved: boolean;
  /** Completed demo evaluations in order; choosing or previewing an answer adds nothing. */
  attempts: string[];
  /** Last completed evaluation, retained while preparing a retry. */
  outcome?: "correct" | "partial" | "wrong";
}

/** Only authored demo questions may use local feedback. Real grading remains server-owned. */
export interface DemoPracticeFeedback {
  correctOptionId: string;
  explanation?: PracticeContent;
}
