/** Frontend view data only; not an official ranking or analytics contract. */
export interface LeaderboardUser {
  id: string;
  name: string;
  initials: string;
  title?: string;
  questionsSolved: number;
  accuracyRate: number | null;
  hardQuestionsSolved: number;
  /** Illustrative comparisons only; independent of the seven-row ranking sample. */
  comparison?: {
    weeklyAccuracyChangePercent?: number;
    hardTopPercent?: number;
  };
}

export interface LeaderboardSnapshot {
  users: LeaderboardUser[];
  currentUserId: string;
  totalQuestions: number;
  updatedAt: string;
}
