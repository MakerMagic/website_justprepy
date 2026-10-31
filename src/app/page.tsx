import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "JustPrepy",
  description: "JustPrepy entrance-exam preparation platform.",
};

export default function HomePage() {
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>JustPrepy</h1>
      <p>Welcome to JustPrepy, your platform for entrance-exam preparation.</p>
      <nav aria-label="Authentication navigation" style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "1rem" }}>
        <Link href="/login">Log in</Link>
        <Link href="/signup">Sign up</Link>
      </nav>
    </main>
  );
}
