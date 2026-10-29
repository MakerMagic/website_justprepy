import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockDemoResults } from "@/modules/mock-tests/mock-test-demo-results";
import { MockTestResults } from "@/modules/mock-tests/mock-test-results";
import { demoMockTests } from "@/modules/mock-tests/mock-tests.fixtures";
import { completedMockTest } from "@/modules/mock-tests/mock-test-results.logic";
export const metadata: Metadata = { title: "Mock Test Results | justprepy" };
export default async function MockTestResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ testId: string }>;
  searchParams: Promise<{ attempt?: string | string[] }>;
}) {
  const { testId } = await params;
  const { attempt } = await searchParams;
  if (Array.isArray(attempt)) notFound();
  if (attempt?.startsWith("demo-attempt-")) {
    const catalogueTest = demoMockTests.find((item) => item.id === testId);
    if (!catalogueTest) notFound();
    return (
      <MockDemoResults
        key={testId + attempt}
        test={catalogueTest}
        attemptId={attempt}
      />
    );
  }
  const test = completedMockTest(demoMockTests, testId, attempt);
  if (!test) notFound();
  return (
    <MockTestResults
      key={test.id + test.result!.completedAt}
      test={test}
      illustrative
    />
  );
}
