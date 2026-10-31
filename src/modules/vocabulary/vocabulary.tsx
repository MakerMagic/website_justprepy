"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { StatisticCard } from "../../components/statistic-card";
import { PracticeShell } from "../questions/practice-shell";
import { Icon } from "../questions/icon";
import type { QuestionBankData } from "../questions/question-bank.types";
import type { VocabularyData, VocabularyPreset } from "./vocabulary.fixtures";
import "../questions/practice-modals.css";
import "./vocabulary.css";
import { VocabularyInspector } from "./vocabulary-inspector";
import { VocabularyPractice } from "./vocabulary-practice";
import { practiceQueue, type PracticeEntry } from "./vocabulary-practice-state";
import { createDemoWordState } from "./vocabulary-words.fixtures";
import { vocabularyWordsReducer, vocabularyWordKey } from "./vocabulary-words";
import {
  loadSavedWords,
  persistSavedWords,
} from "./vocabulary-practice-storage";

/**
 * Vocabulary tag.svg and trending-up.svg geometry from
 * https://github.com/lucide-icons/lucide/tree/main/icons (2026-10-27).
 *
 * ISC License
 * Copyright (c) 2026 Lucide Icons and Contributors
 *
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 */
export function VocabularyPresetCard({
  preset,
  selected,
  onSelect,
  onInspect,
}: {
  preset: VocabularyPreset;
  selected: boolean;
  onSelect: (id: string) => void;
  onInspect: (preset: VocabularyPreset) => void;
}) {
  const inputId = "vocabulary-preset-" + preset.id;
  const titleId = inputId + "-title";
  return (
    <article
      className="vocabulary-preset"
      data-selected={selected}
      aria-labelledby={titleId}
    >
      <div className="vocabulary-preset-heading">
        <div>
          {preset.custom && (
            <p className="vocabulary-custom-label">Custom Deck</p>
          )}
          <h3 id={titleId}>
            <label htmlFor={inputId}>{preset.title}</label>
          </h3>
        </div>
        <div className="vocabulary-selection">
          <input
            id={inputId}
            type="checkbox"
            name="vocabulary-preset"
            value={preset.id}
            checked={selected}
            onChange={() => onSelect(preset.id)}
            aria-labelledby={titleId}
          />
          <span className="vocabulary-selection-indicator" aria-hidden="true">
            <Icon name="check" size={16} />
          </span>
        </div>
      </div>
      <p className="vocabulary-preset-description">{preset.description}</p>
      <div className="vocabulary-preset-footer">
        <p className="vocabulary-word-count">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            data-vocabulary-icon="tag"
          >
            <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
            <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
          </svg>
          <span>{preset.wordCount} Words available</span>
        </p>
        <button
          type="button"
          className="button secondary vocabulary-inspect"
          aria-label={"Inspect Words in " + preset.title}
          aria-haspopup="dialog"
          onClick={() => onInspect(preset)}
        >
          <Icon name="eye" size={18} />
          Inspect Words
        </button>
      </div>
    </article>
  );
}
type Preview = { kind: "inspect"; preset: VocabularyPreset };
export function Vocabulary({
  data,
  profile,
  telegramUrl,
}: {
  data: VocabularyData;
  profile: QuestionBankData["profile"];
  telegramUrl: string | null;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    data.presets[0] ? [data.presets[0].id] : [],
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const selected = data.presets.filter(({ id }) => selectedIds.includes(id));
  const [words, dispatch] = useReducer(
    vocabularyWordsReducer,
    data.presets,
    (items) => createDemoWordState(items.map((item) => item.id)),
  );
  const [practice, setPractice] = useState<readonly PracticeEntry[] | null>(
    null,
  );
  const [storageReady, setStorageReady] = useState(false);
  const practiceButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        dispatch({ type: "restore-saves", items: loadSavedWords() });
        setStorageReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (storageReady && words.savePreferences.length)
      persistSavedWords(words.savePreferences);
  }, [storageReady, words.savePreferences]);
  useEffect(() => {
    if (practice === null && returnFocus.current) {
      returnFocus.current = false;
      practiceButton.current?.focus();
    }
  }, [practice]);

  function togglePreset(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id],
    );
  }
  return (
    <PracticeShell
      profile={profile}
      telegramUrl={telegramUrl}
      skipLabel="Skip to vocabulary"
    >
      {practice !== null ? (
        <VocabularyPractice
          entries={practice}
          words={words}
          onSave={(entry, saved) =>
            dispatch({
              type: "save-word",
              key: entry.key,
              word: entry.word,
              saved,
            })
          }
          onExclude={(entry) => {
            for (const [presetId, items] of Object.entries(words.words))
              for (const word of items)
                if (vocabularyWordKey(presetId, word) === entry.key)
                  dispatch({ type: "exclude", presetId, id: word.id });
          }}
          onExit={() => {
            returnFocus.current = true;
            setPractice(null);
          }}
        />
      ) : (
        <main
          id="main-content"
          tabIndex={-1}
          className="bank-content vocabulary-content"
          data-ui
        >
          <section
            className="page-heading vocabulary-intro"
            aria-labelledby="vocabulary-title"
          >
            <div className="intro-copy">
              <h1 id="vocabulary-title">Master your vocabulary</h1>
              <p>
                Curated word lists, definitions, and context mastery for NUET
                critical reading and comprehension.
              </p>
            </div>
            <div
              className="practice-stats vocabulary-stats"
              aria-label="Vocabulary statistics"
            >
              <StatisticCard
                label="Words Learned"
                value={data.wordsLearned}
                motif="check"
                decoration={
                  <span
                    className="vocabulary-book-motif"
                    data-vocabulary-icon="book"
                  >
                    <Icon name="book" size={80} />
                  </span>
                }
              />
              <StatisticCard
                label="Retention Rate"
                value={data.retentionRate + "%"}
                motif="trend"
                decoration={
                  <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    data-vocabulary-icon="growth"
                  >
                    <path d="M16 7h6v6" />
                    <path d="m22 7-8.5 8.5-5-5L2 17" />
                  </svg>
                }
              />
            </div>
          </section>
          <section aria-labelledby="vocabulary-presets-title">
            <div className="vocabulary-presets-heading">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                data-vocabulary-icon="presets"
              >
                {/* Three stepped outlines from the supplied Presets reference. */}
                <rect x="7" y="2" width="10" height="4" rx="1" />
                <rect x="5" y="6" width="14" height="4" rx="1" />
                <rect x="2" y="10" width="20" height="12" rx="1" />
              </svg>
              <h2 id="vocabulary-presets-title">Presets</h2>
              <span className="vocabulary-availability">
                {data.presets.length} Available
              </span>
            </div>
            <fieldset className="vocabulary-grid">
              <legend className="sr-only">Choose vocabulary presets</legend>
              {data.presets.map((preset) => (
                <VocabularyPresetCard
                  key={preset.id}
                  preset={{
                    ...preset,
                    wordCount: (words.words[preset.id] ?? []).length,
                  }}
                  selected={selectedIds.includes(preset.id)}
                  onSelect={togglePreset}
                  onInspect={(item) =>
                    setPreview({ kind: "inspect", preset: item })
                  }
                />
              ))}
            </fieldset>
            <button
              type="button"
              className="button vocabulary-practice"
              ref={practiceButton}
              disabled={selected.length === 0}
              onClick={() =>
                selected.length > 0 &&
                setPractice(
                  practiceQueue(
                    words,
                    selected.map((item) => item.id),
                  ),
                )
              }
            >
              Practice <Icon name="arrow" size={20} />
            </button>
          </section>
        </main>
      )}
      <VocabularyInspector
        preset={preview?.kind === "inspect" ? preview.preset : null}
        state={words}
        dispatch={dispatch}
        onClose={() => setPreview(null)}
      />
    </PracticeShell>
  );
}
