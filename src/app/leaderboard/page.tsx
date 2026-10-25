import type { Metadata } from "next";
import { Leaderboard } from "@/modules/leaderboard/leaderboard";
import { demoLeaderboard } from "@/modules/leaderboard/leaderboard.fixtures";
import { demoQuestionBank } from "@/modules/questions/question-bank.fixtures";

export const metadata: Metadata = {
  title: "Leaderboard | JustPrepy",
  description:
    "Explore illustrative NUET practice rankings and your next rank milestone.",
};

export default function LeaderboardPage() {
  return (
    <Leaderboard
      data={demoLeaderboard}
      profile={demoQuestionBank.profile}
      telegramUrl={demoQuestionBank.telegramUrl}
    />
  );
}
