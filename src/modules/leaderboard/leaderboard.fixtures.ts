import { demoQuestionBank } from "../questions/question-bank.fixtures";
import { summarize } from "../questions/question-bank.logic";
import type { LeaderboardSnapshot } from "./leaderboard.types";

const progress = summarize(demoQuestionBank.questions);

/** Illustrative peers. Current-user progress reuses the existing Question Bank fixtures. */
export const demoLeaderboard: LeaderboardSnapshot = {
  currentUserId: "demo-current-user",
  totalQuestions: progress.total,
  updatedAt: "2026-10-25T04:00:00Z",
  users: [
    {
      id: "demo-sanzhar",
      name: "Sanzhar_K",
      initials: "SK",
      title: "Mathematics enthusiast",
      questionsSolved: 412,
      accuracyRate: 96.8,
      hardQuestionsSolved: 124,
    },
    {
      id: "demo-amina",
      name: "Amina_T",
      initials: "AT",
      title: "Critical thinking practice",
      questionsSolved: 380,
      accuracyRate: 94.1,
      hardQuestionsSolved: 112,
    },
    {
      id: "demo-daniyar",
      name: "Daniyar_99",
      initials: "D9",
      title: "Problem solving enthusiast",
      questionsSolved: 325,
      accuracyRate: 91.5,
      hardQuestionsSolved: 98,
    },
    {
      id: "demo-nursultan",
      name: "Nursultan_Ex",
      initials: "NE",
      title: "Building a daily practice habit",
      questionsSolved: 179,
      accuracyRate: 88.2,
      hardQuestionsSolved: 53,
    },
    {
      id: "demo-alikhan",
      name: "Alikhan N.",
      initials: "AN",
      title: "NUET preparation",
      questionsSolved: 93,
      accuracyRate: 84,
      hardQuestionsSolved: 28,
    },
    {
      id: "demo-current-user",
      name: demoQuestionBank.profile.name,
      initials: demoQuestionBank.profile.initials,
      title: "NUET aspirant",
      // Requested demonstration labels, not measured history or a seven-row percentile.
      comparison: {
        weeklyAccuracyChangePercent: 2.1,
        hardTopPercent: 5,
      },
      questionsSolved: progress.answered,
      accuracyRate: progress.accuracy,
      hardQuestionsSolved: summarize(
        demoQuestionBank.questions.filter(
          (question) => question.difficulty === "hard",
        ),
      ).answered,
    },
    {
      id: "demo-zere",
      name: "Zere_M",
      initials: "ZM",
      title: "Quantitative reasoning practice",
      questionsSolved: 76,
      accuracyRate: 75.8,
      hardQuestionsSolved: 20,
    },
  ],
};
