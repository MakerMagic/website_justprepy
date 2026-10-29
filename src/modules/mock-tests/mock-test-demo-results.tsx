"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MockTestResults } from "./mock-test-results";
import { demoAttemptResult } from "./mock-test-attempt.logic";
import { readDemoAttempts } from "./mock-test-attempt.storage";
import type { MockTest } from "./mock-tests.types";
export function MockDemoResults({
  test,
  attemptId,
}: {
  test: MockTest;
  attemptId: string;
}) {
  const [result, setResult] = useState<MockTest | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => {
      try {
        const attempt = readDemoAttempts(test).find((a) => a.id === attemptId);
        setResult(attempt ? demoAttemptResult(test, attempt) : null);
      } catch {
        setResult(null);
      }
      setLoaded(true);
    });
  }, [test, attemptId]);
  if (!result)
    return (
      <main className="practice-empty">
        <h1>
          {loaded
            ? "Demo results are unavailable in this browser."
            : "Loading results…"}
        </h1>
        <Link href="/mock-tests">Back to Mock Tests</Link>
      </main>
    );
  return <MockTestResults test={result} illustrative />;
}
