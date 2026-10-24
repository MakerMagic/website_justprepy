"use client";
import { useState } from "react";
import type {
  BankFilters,
  Difficulty,
  QuestionSource,
  QuestionStatus,
} from "./question-bank.types";
import {
  applySourceYears,
  defaultFilters,
  toggleValue,
} from "./question-bank.logic";
import { Icon } from "./icon";
import { Popover } from "./popover";
const statuses: { value: QuestionStatus; label: string; icon: string }[] = [
  { value: "correct", label: "Correct", icon: "check" },
  { value: "partial", label: "Partly Wrong", icon: "partial" },
  { value: "wrong", label: "Wrong", icon: "cross" },
];
const difficulties: { value: Difficulty; label: string }[] = [
  { value: "hard", label: "Hard" },
  { value: "medium", label: "Medium" },
  { value: "easy", label: "Easy" },
];
function SourceYears({
  source,
  value,
  onChange,
}: {
  source: QuestionSource;
  value: BankFilters;
  onChange: (value: BankFilters) => void;
}) {
  const [draft, setDraft] = useState<number[]>([]);
  const selected = value.sources.includes(source.id);
  const committed = value.yearsBySource[source.id] ?? [];
  const id = `source-years-${source.id}`;
  if (!source.years)
    return (
      <button
        type="button"
        className="chip source-chip"
        aria-pressed={selected}
        onClick={() => onChange(applySourceYears(value, source, []))}
      >
        {source.label}
        {selected && <Icon name="check" size={13} />}
      </button>
    );
  return (
    <Popover
      id={id}
      title={`${source.label} years`}
      className="source-popover"
      pressed={selected}
      onOpen={() => setDraft([...committed])}
      trigger={
        <>
          <span>{source.label}</span>
          {committed.length > 0 && (
            <span className="source-year-count" title={committed.join(", ")}>
              {committed.length}
              <span className="sr-only"> years</span>
            </span>
          )}
          <Icon name="down" size={13} />
        </>
      }
      action={
        <button
          type="button"
          className="button accent compact"
          popoverTarget={id}
          popoverTargetAction="hide"
          onClick={() => onChange(applySourceYears(value, source, draft))}
        >
          Apply
        </button>
      }
    >
      <div className="year-toolbar">
        <span>
          <strong>{draft.length}</strong> selected
        </span>
        <button
          type="button"
          className="year-select-all"
          onClick={() => setDraft([...(source.years ?? [])])}
        >
          Select All
        </button>
        <button
          type="button"
          className="year-clear"
          onClick={() => setDraft([])}
        >
          Clear
        </button>
      </div>
      <div className="year-grid">
        {source.years.map((year) => (
          <button
            type="button"
            className="year-option"
            key={year}
            aria-pressed={draft.includes(year)}
            onClick={() => setDraft((current) => toggleValue(current, year))}
          >
            {year}
            {draft.includes(year) && <Icon name="check" size={13} />}
          </button>
        ))}
      </div>
      <p className="year-note">
        Illustrative availability. No selection includes all years.
      </p>
    </Popover>
  );
}
export function Filters({
  value,
  onChange,
  sources,
  matching,
}: {
  value: BankFilters;
  onChange: (value: BankFilters) => void;
  sources: QuestionSource[];
  matching: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const changed = JSON.stringify(value) !== JSON.stringify(defaultFilters);
  return (
    <section
      className="filters-panel"
      aria-labelledby="filters-title"
      data-expanded={expanded}
    >
      <div className="filters-heading">
        <h2 id="filters-title">
          Filters
          <Icon name="filter" size={15} />
        </h2>
        <span className="matching-count" aria-live="polite">
          {matching} questions
        </span>
        <button
          type="button"
          className="text-button reset-filters"
          disabled={!changed}
          onClick={() => onChange({ ...defaultFilters })}
        >
          Reset
        </button>
        <button
          type="button"
          className="mobile-filter-toggle icon-button"
          aria-label={expanded ? "Hide filters" : "Show filters"}
          aria-expanded={expanded}
          aria-controls="filter-controls"
          onClick={() => setExpanded((current) => !current)}
        >
          <Icon name={expanded ? "cross" : "down"} size={18} />
        </button>
      </div>
      <div id="filter-controls" className="filter-controls">
        <fieldset className="filter-group status-group">
          <legend className="sr-only">Question status</legend>
          <span className="group-label" aria-hidden="true">
            Question status
          </span>
          <div className="chips">
            {statuses.map((status) => (
              <button
                type="button"
                className="chip"
                key={status.value}
                aria-pressed={value.statuses.includes(status.value)}
                onClick={() =>
                  onChange({
                    ...value,
                    statuses: toggleValue(value.statuses, status.value),
                  })
                }
              >
                {status.label}
                <Icon name={status.icon} size={13} />
              </button>
            ))}
            <button
              type="button"
              className="chip"
              aria-pressed={value.savedOnly}
              onClick={() =>
                onChange({ ...value, savedOnly: !value.savedOnly })
              }
            >
              Saved
              <Icon name="bookmark" size={13} />
            </button>
          </div>
        </fieldset>
        <fieldset className="filter-group source-group">
          <legend className="sr-only">Sources</legend>
          <span className="group-label" aria-hidden="true">
            Sources
          </span>
          <div className="source-selectors">
            {sources.map((source) => (
              <SourceYears
                key={source.id}
                source={source}
                value={value}
                onChange={onChange}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="filter-group difficulty-group">
          <legend className="sr-only">Difficulty</legend>
          <span className="group-label" aria-hidden="true">
            Difficulty
          </span>
          <div className="chips">
            {difficulties.map((item) => (
              <button
                type="button"
                className="chip"
                key={item.value}
                aria-pressed={value.difficulties.includes(item.value)}
                onClick={() =>
                  onChange({
                    ...value,
                    difficulties: toggleValue(value.difficulties, item.value),
                  })
                }
              >
                {item.label}
                <Icon
                  name={
                    item.value === "hard"
                      ? "partial"
                      : item.value === "medium"
                        ? "chart"
                        : "check"
                  }
                  size={13}
                />
              </button>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  );
}
