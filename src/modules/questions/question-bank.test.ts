import { placePopover } from "./popover-position";
import { describe, expect, it } from "vitest";
import { demoQuestionBank } from "./question-bank.fixtures";
import {
  availableYears,
  applySourceYears,
  reconcileFilters,
  defaultFilters,
  filterQuestions,
  summarize,
  toggleValue,
} from "./question-bank.logic";

describe("question bank view data", () => {
  it("derives all progress from the same illustrative records", () => {
    const { questions, subjects } = demoQuestionBank;
    expect(new Set(questions.map((question) => question.id)).size).toBe(
      questions.length,
    );
    const topicIds = subjects.flatMap((subject) =>
      subject.topics.map((topic) => topic.id),
    );
    expect(
      questions.every((question) => topicIds.includes(question.topicId)),
    ).toBe(true);
    expect(summarize(questions).answered).toBe(
      questions.filter((question) => question.status !== "unanswered").length,
    );
  });
  it("combines filter groups with AND and selections within a group with OR", () => {
    const result = filterQuestions(demoQuestionBank.questions, {
      ...defaultFilters,
      statuses: ["correct", "wrong"],
      difficulties: ["hard"],
      yearsBySource: { "tsa-oxford": [2024, 2023] },
      savedOnly: true,
    });
    expect(result.length).toBeGreaterThan(0);
    expect(
      result.every(
        (question) =>
          ["correct", "wrong"].includes(question.status) &&
          question.difficulty === "hard" &&
          question.year !== null &&
          [2024, 2023].includes(question.year) &&
          question.saved &&
          question.source === "tsa-oxford",
      ),
    ).toBe(true);
  });
  it("treats empty source and year selections as all", () => {
    expect(
      filterQuestions(demoQuestionBank.questions, {
        ...defaultFilters,
        sources: [],
      }).length,
    ).toBe(demoQuestionBank.questions.length);
  });
  it("returns honest zeros and unavailable accuracy for an empty set", () => {
    expect(summarize([])).toEqual({
      total: 0,
      answered: 0,
      correct: 0,
      accuracy: null,
    });
  });
  it("does not mutate selection arrays", () => {
    const selected = [2024];
    expect(toggleValue(selected, 2023)).toEqual([2024, 2023]);
    expect(selected).toEqual([2024]);
    expect(toggleValue(selected, 2024)).toEqual([]);
  });
  it("only offers years for configured year-based sources", () => {
    const { sources } = demoQuestionBank;
    expect(availableYears(sources, ["nuet-practice"])).toEqual([]);
    expect(availableYears(sources, ["tsa-oxford"])).toContain(2024);
    expect(
      reconcileFilters(
        {
          ...defaultFilters,
          yearsBySource: {
            "tsa-oxford": [2024, 1900],
            bmat: [2023, 1900],
            "nuet-practice": [2024],
          },
        },
        sources,
      ).yearsBySource,
    ).toEqual({ "tsa-oxford": [2024], bmat: [2023] });
  });
  it("reconciles historical coverage against fixtures and never invents years for undated material", () => {
    const { sources, questions } = demoQuestionBank;
    for (const source of sources) {
      const records = questions.filter(
        (question) => question.source === source.id,
      );
      if (source.years) {
        expect(
          [...new Set(records.map((question) => question.year))].sort(),
        ).toEqual([...source.years].sort());
      } else
        expect(records.every((question) => question.year === null)).toBe(true);
    }
  });
  it("applies year selection to dated papers without excluding undated practice", () => {
    const result = filterQuestions(demoQuestionBank.questions, {
      ...defaultFilters,
      sources: [],
      yearsBySource: { "tsa-oxford": [2024] },
    });
    expect(result.some((question) => question.source === "nuet-practice")).toBe(
      true,
    );
    expect(
      result
        .filter((question) => question.source === "tsa-oxford")
        .every((question) => question.year === 2024),
    ).toBe(true);
  });
  it("keeps each source's applied years independent across source switches", () => {
    const oxford = demoQuestionBank.sources.find(
      (source) => source.id === "tsa-oxford",
    )!;
    const bmat = demoQuestionBank.sources.find(
      (source) => source.id === "bmat",
    )!;
    const oxfordFilter = applySourceYears(defaultFilters, oxford, [2024, 2023]);
    const bmatFilter = applySourceYears(oxfordFilter, bmat, [2022]);
    expect(bmatFilter.yearsBySource).toEqual({
      "tsa-oxford": [2024, 2023],
      bmat: [2022],
    });
    expect(bmatFilter.sources).toEqual(["bmat"]);
    const result = filterQuestions(demoQuestionBank.questions, bmatFilter);
    expect(result).toHaveLength(15);
    expect(
      result.every(
        (question) => question.source === "bmat" && question.year === 2022,
      ),
    ).toBe(true);
    const restored = applySourceYears(
      bmatFilter,
      oxford,
      bmatFilter.yearsBySource["tsa-oxford"],
    );
    expect(filterQuestions(demoQuestionBank.questions, restored)).toHaveLength(
      30,
    );
    expect(oxfordFilter.yearsBySource).toEqual({ "tsa-oxford": [2024, 2023] });
  });
  it("clears only the clicked source's years and ignores invalid years on Apply", () => {
    const bmat = demoQuestionBank.sources.find(
      (source) => source.id === "bmat",
    )!;
    const filters = {
      ...defaultFilters,
      yearsBySource: { "tsa-oxford": [2024], bmat: [2022] },
    };
    const cleared = applySourceYears(filters, bmat, []);
    expect(cleared.yearsBySource).toEqual({ "tsa-oxford": [2024], bmat: [] });
    expect(filterQuestions(demoQuestionBank.questions, cleared)).toHaveLength(
      90,
    );
    expect(
      applySourceYears(filters, bmat, [2024, 2023, 2023]).yearsBySource.bmat,
    ).toEqual([2023]);
  });
});

describe("popover anchor geometry", () => {
  it("aligns an account panel beside the actual trigger, including a collapsed rail", () => {
    const size = { width: 304, height: 280 },
      viewport = { width: 1440, height: 900 };
    expect(
      placePopover(
        { left: 12, right: 242, top: 820, bottom: 884 },
        size,
        viewport,
        true,
      ),
    ).toEqual({ left: 250, top: 604, height: 280, placement: "right" });
    expect(
      placePopover(
        { left: 12, right: 58, top: 820, bottom: 884 },
        size,
        viewport,
        true,
      ).left,
    ).toBe(66);
  });
  it("keeps mobile and edge-constrained panels inside the viewport", () => {
    const mobile = placePopover(
      { left: 12, right: 242, top: 760, bottom: 824 },
      { width: 304, height: 280 },
      { width: 390, height: 844 },
      true,
    );
    expect(mobile.top).toBe(472);
    expect(mobile.left).toBe(43);
    const edge = placePopover(
      { left: 1260, right: 1380, top: 700, bottom: 744 },
      { width: 380, height: 440 },
      { width: 1440, height: 900 },
      false,
    );
    expect(edge).toEqual({
      left: 1048,
      top: 252,
      height: 440,
      placement: "above",
    });
  });
});

describe("Question Bank interaction regressions", () => {
  it.each(["correct", "partial", "wrong"] as const)(
    "selects and deselects %s without stale results",
    (status) => {
      const selected = {
        ...defaultFilters,
        statuses: toggleValue(defaultFilters.statuses, status),
      };
      const results = filterQuestions(demoQuestionBank.questions, selected);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((question) => question.status === status)).toBe(
        true,
      );
      const cleared = {
        ...selected,
        statuses: toggleValue(selected.statuses, status),
      };
      expect(filterQuestions(demoQuestionBank.questions, cleared)).toEqual(
        filterQuestions(demoQuestionBank.questions, defaultFilters),
      );
    },
  );
  it.each(["hard", "medium", "easy"] as const)(
    "combines %s with saved and multiple statuses",
    (difficulty) => {
      const results = filterQuestions(demoQuestionBank.questions, {
        ...defaultFilters,
        difficulties: [difficulty],
        statuses: ["correct", "wrong"],
        savedOnly: true,
      });
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (question) =>
            question.difficulty === difficulty &&
            question.saved &&
            ["correct", "wrong"].includes(question.status),
        ),
      ).toBe(true);
    },
  );
  it("keeps an empty source/status combination empty until reset", () => {
    const bmat = demoQuestionBank.sources.find(
      (source) => source.id === "bmat",
    )!;
    const selected = applySourceYears(
      { ...defaultFilters, statuses: ["correct"] },
      bmat,
      [2022],
    );
    expect(filterQuestions(demoQuestionBank.questions, selected)).toEqual([]);
    expect(
      filterQuestions(demoQuestionBank.questions, defaultFilters).length,
    ).toBeGreaterThan(0);
  });
  it("shrinks a year panel to the available side instead of covering its trigger", () => {
    const result = placePopover(
      { left: 118, right: 226, top: 368, bottom: 412 },
      { width: 380, height: 520 },
      { width: 900, height: 600 },
      false,
    );
    expect(result).toEqual({
      left: 118,
      top: 12,
      height: 348,
      placement: "above",
    });
  });
  it("reanchors after a scroll and clamps horizontal placement at the viewport edge", () => {
    const size = { width: 380, height: 300 },
      viewport = { width: 1024, height: 800 };
    const before = placePopover(
      { left: 800, right: 920, top: 200, bottom: 244 },
      size,
      viewport,
      false,
    );
    const after = placePopover(
      { left: 800, right: 920, top: 100, bottom: 144 },
      size,
      viewport,
      false,
    );
    expect(before.left).toBe(632);
    expect(after.left).toBe(before.left);
    expect(after.top).toBe(before.top - 100);
    expect(after.top).toBe(152);
  });
});
