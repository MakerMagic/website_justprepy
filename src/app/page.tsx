import type { Metadata } from "next";
import { QuestionBank } from "@/modules/questions/question-bank";
import { demoQuestionBank } from "@/modules/questions/question-bank.fixtures";

export const metadata: Metadata = {
  title: "Question bank | JustPrepy",
  description:
    "Explore Critical Thinking, Problem Solving and Mathematics topics for NUET preparation.",
};

export default function Home() {
  return <QuestionBank data={demoQuestionBank} />;
}
