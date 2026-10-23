import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const documents = [
  "AGENTS.md",
  "README.md",
  "docs/PROJECT_SCOPE.md",
  "docs/ARCHITECTURE.md",
  "docs/CONTENT_CONTRACT.md",
  "docs/BACKEND_DATA.md",
  "docs/FRONTEND.md",
  "docs/DESIGN_SYSTEM.md",
  "docs/SECURITY.md",
  "docs/DEVELOPMENT.md",
  "docs/adr/0001-foundation.md",
];

describe("repository foundation", () => {
  it("contains authoritative documents", () => {
    for (const document of documents) {
      expect(existsSync(resolve(root, document)), document).toBe(true);
    }
  });
  it("resolves local Markdown navigation links", () => {
    let links = 0;
    for (const document of documents) {
      const path = resolve(root, document);
      for (const match of readFileSync(path, "utf8").matchAll(
        /\[[^\]]+\]\(([^)]+)\)/g,
      )) {
        const target = match[1].split("#")[0];
        if (!target || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;
        expect(
          existsSync(resolve(dirname(path), target)),
          `${document} -> ${target}`,
        ).toBe(true);
        links += 1;
      }
    }
    expect(links).toBeGreaterThan(0);
  });
});
