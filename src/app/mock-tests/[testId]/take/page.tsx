import { notFound } from "next/navigation";
import { demoMockTests } from "@/modules/mock-tests/mock-tests.fixtures";
import { MockTestEntry } from "@/modules/mock-tests/mock-test-taking";
export const metadata = { title: "Mock Test | justprepy" };
export default async function MockTakePage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{
    attempt?: string | string[];
    mode?: string | string[];
  }>;
}) {
  const { testId } = await params;
  const { attempt, mode } = await searchParams;
  const test = demoMockTests.find((test) => test.id === testId);
  if (!test || Array.isArray(attempt) || Array.isArray(mode)) notFound();
  return (
    <MockTestEntry
      key={test.id}
      test={test}
      attemptId={attempt}
      retake={mode === "retake"}
    />
  );
}
