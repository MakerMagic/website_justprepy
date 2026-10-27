import type { Metadata } from "next";
import { Vocabulary } from "@/modules/vocabulary/vocabulary";
import { demoVocabulary } from "@/modules/vocabulary/vocabulary.fixtures";
import { demoQuestionBank } from "@/modules/questions/question-bank.fixtures";
export const metadata: Metadata = {
  title: "Vocabulary | justprepy",
  description:
    "Curated word lists for NUET critical reading and comprehension.",
};
export default function VocabularyPage() {
  return (
    <Vocabulary
      data={demoVocabulary}
      profile={demoQuestionBank.profile}
      telegramUrl={demoQuestionBank.telegramUrl}
    />
  );
}
