import type { Metadata } from "next";
import { Analytics } from "@/modules/analytics/analytics";
import { demoQuestionBank } from "@/modules/questions/question-bank.fixtures";
export const metadata: Metadata = {
  title: "Analytics · justprepy",
  description:
    "Illustrative NUET practice, mock test and vocabulary analytics.",
};
export default function AnalyticsPage() {
  return (
    <Analytics
      profile={demoQuestionBank.profile}
      telegramUrl={demoQuestionBank.telegramUrl}
    />
  );
}
