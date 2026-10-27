"use client";
import { useState, type RefObject } from "react";
import { Icon } from "../questions/icon";
import { validateWord, type VocabularyWord } from "./vocabulary-words";
export type WordDialogMode =
  { kind: "add" } | { kind: "edit" | "view"; word: VocabularyWord };
export function VocabularyWordDialog({
  mode,
  open,
  dialogRef,
  onClose,
  onSave,
}: {
  mode: WordDialogMode;
  open: boolean;
  dialogRef: RefObject<HTMLFormElement | null>;
  onClose: () => void;
  onSave: (word: string, meaning: string) => void;
}) {
  const [word, setWord] = useState(mode.kind === "add" ? "" : mode.word.word);
  const [meaning, setMeaning] = useState(
    mode.kind === "add" ? "" : mode.word.meaning,
  );
  const readOnly = mode.kind === "view";
  const validation = validateWord(word, meaning);
  return (
    <div
      className={"vi-layer vi-edit-layer" + (open ? " vi-open" : "")}
      inert={!open}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        className="vi-dlg vi-ed"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vocabulary-word-title"
        ref={dialogRef}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!readOnly && validation.valid) onSave(word, meaning);
        }}
      >
        <div className="vi-ed-b">
          <button
            type="button"
            className="vi-x"
            aria-label="Close word dialog"
            onClick={onClose}
          >
            <Icon name="cross" size={18} />
          </button>
          <h2 id="vocabulary-word-title">
            {mode.kind === "add"
              ? "Add your own word"
              : readOnly
                ? "Word details"
                : "Edit word"}
          </h2>
          <label htmlFor="vocabulary-word-input">Word or short phrase</label>
          <input
            id="vocabulary-word-input"
            autoComplete="off"
            placeholder="e.g. serendipity"
            required
            readOnly={readOnly}
            value={word}
            onChange={(event) => setWord(event.target.value)}
            aria-invalid={Boolean(validation.wordError)}
            aria-describedby="vocabulary-word-error"
          />
          <p className="vi-err" id="vocabulary-word-error" aria-live="polite">
            {validation.wordError}
          </p>
          <label htmlFor="vocabulary-meaning-input">
            Meaning or Translation
          </label>
          <textarea
            id="vocabulary-meaning-input"
            rows={3}
            placeholder="A meaning in your own words or language"
            required
            readOnly={readOnly}
            value={meaning}
            onChange={(event) => setMeaning(event.target.value)}
            aria-invalid={Boolean(validation.meaningError)}
            aria-describedby="vocabulary-meaning-error"
          />
          <p
            className="vi-err"
            id="vocabulary-meaning-error"
            aria-live="polite"
          >
            {validation.meaningError}
          </p>
        </div>
        <div className="vi-ed-f">
          <button type="button" className="vi-btn" onClick={onClose}>
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <button
              type="submit"
              className="vi-btn vi-primary"
              disabled={!validation.valid}
            >
              {mode.kind === "add" ? "Add Word" : "Save"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
