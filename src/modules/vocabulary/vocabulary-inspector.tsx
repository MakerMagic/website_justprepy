"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type Dispatch,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "../questions/icon";
import type { VocabularyPreset } from "./vocabulary.fixtures";
import {
  VocabularyWordDialog,
  type WordDialogMode,
} from "./vocabulary-word-dialog";
import {
  canManageWords,
  STATUS_LABELS,
  type VocabularyWordState,
  type VocabularyWordAction,
  wordStatus,
  type VocabularyWord,
  type WordStatus,
} from "./vocabulary-words";
import "./vocabulary-inspector.css";

type Menu = {
  word: VocabularyWord;
  anchor: HTMLButtonElement;
  left: number;
  top: number;
  open: boolean;
};
type RemovingRow = {
  presetId: string;
  word: VocabularyWord;
  status: WordStatus;
  index: number;
  height: number;
  collapsing: boolean;
};

export function VocabularyInspector({
  preset,
  state,
  dispatch,
  onClose,
}: {
  preset: VocabularyPreset | null;
  state: VocabularyWordState;
  dispatch: Dispatch<VocabularyWordAction>;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);
  const [editor, setEditor] = useState<WordDialogMode | null>(null);
  const [editorClosing, setEditorClosing] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [removing, setRemoving] = useState<RemovingRow[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLFormElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const wordTrigger = useRef<HTMLElement | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const sequence = useRef(0);
  const open = preset !== null;
  const own = preset ? canManageWords(preset.id) : false;
  const words = preset ? (state.words[preset.id] ?? []) : [];

  function later(callback: () => void, ms: number) {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, ms);
    timers.current.add(timer);
  }
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  // Each toast owns its original deadline, even after switching or closing presets.
  useEffect(() => {
    const pending = state.deletions.map((deletion) =>
      setTimeout(
        () => {
          dispatch({
            type: deletion.dismissed ? "forget" : "expire",
            token: deletion.token,
          });
        },
        deletion.dismissed ? 200 : Math.max(0, deletion.expiresAt - Date.now()),
      ),
    );
    return () => pending.forEach(clearTimeout);
  }, [state.deletions, dispatch]);

  useEffect(() => {
    if (!open) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const background =
      document.querySelector<HTMLElement>(".question-bank-app");
    const previousInert = background?.inert ?? false;
    const overflow = document.body.style.overflow;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    scrollRef.current?.scrollTo(0, 0);
    dialogRef.current?.querySelector<HTMLButtonElement>(".vi-x")?.focus();
    return () => {
      if (background) background.inert = previousInert;
      document.body.style.overflow = overflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open]);

  useEffect(() => {
    if (!editor) {
      wordTrigger.current?.focus({ preventScroll: true });
      return;
    }
    const frame = requestAnimationFrame(() => {
      const target = editor.kind === "view" ? ".vi-x" : "input";
      editorRef.current?.querySelector<HTMLElement>(target)?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editor]);
  useEffect(() => {
    if (menu?.open)
      menuRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, [menu]);

  function closeMenu(refocus = false) {
    if (!menu?.open) return;
    const anchor = menu.anchor;
    setMenu({ ...menu, open: false });
    later(
      () =>
        setMenu((current) =>
          current?.anchor === anchor && !current.open ? null : current,
        ),
      150,
    );
    if (refocus) anchor.focus({ preventScroll: true });
  }
  function closeEditor() {
    if (!editor || editorClosing) return;
    setEditorClosing(true);
    later(() => {
      setEditor(null);
      setEditorClosing(false);
    }, 200);
  }
  function closeInspector() {
    if (closing || editor) return;
    closeMenu();
    setClosing(true);
    later(() => {
      onClose();
      setClosing(false);
    }, 200);
  }
  function openEditor(mode: WordDialogMode, trigger: HTMLElement) {
    if (!preset || (mode.kind !== "view" && !canManageWords(preset.id))) return;
    closeMenu();
    wordTrigger.current = trigger;
    setEditorClosing(false);
    setEditor(mode);
  }
  function saveWord(word: string, meaning: string) {
    // A read-only dialog or a different preset cannot execute content mutations.
    if (
      !preset ||
      !canManageWords(preset.id) ||
      !editor ||
      editor.kind === "view"
    )
      return;
    let id =
      editor.kind === "edit"
        ? editor.word.id
        : "personal-" + ++sequence.current;
    if (editor.kind === "add") {
      while (
        state.words[preset.id].some(
          (word) =>
            word.id === id ||
            word.sourceKey === JSON.stringify([preset.id, id]),
        )
      )
        id = "personal-" + ++sequence.current;
    }
    dispatch({
      type: editor.kind === "edit" ? "edit" : "add",
      presetId: preset.id,
      id,
      word,
      meaning,
    });
    if (editor.kind === "add") {
      setFlash(id);
      scrollRef.current?.scrollTo(0, 0);
    }
    closeEditor();
  }
  function showMenu(word: VocabularyWord, anchor: HTMLButtonElement) {
    if (menu?.open && menu.anchor === anchor) {
      closeMenu(true);
      return;
    }
    const rect = anchor.getBoundingClientRect(),
      width = 156,
      height = 54;
    setMenu({
      word,
      anchor,
      left: Math.max(
        8,
        Math.min(rect.right - width, window.innerWidth - width - 8),
      ),
      top: Math.max(
        8,
        rect.bottom + 6 + height > window.innerHeight - 8
          ? rect.top - height - 6
          : rect.bottom + 6,
      ),
      open: true,
    });
  }
  function deleteWord(
    word: VocabularyWord,
    event: MouseEvent<HTMLButtonElement>,
    now: number,
  ) {
    if (!preset || !canManageWords(preset.id)) return;
    const row = event.currentTarget.closest<HTMLElement>(".vi-row");
    const token = "deleted-" + ++sequence.current;
    const ghost: RemovingRow = {
      presetId: preset.id,
      word,
      status: wordStatus(state, preset.id, word),
      index: words.findIndex((item) => item.id === word.id),
      height: row?.offsetHeight ?? 60,
      collapsing: false,
    };
    setRemoving((previous) => [...previous, ghost]);
    dispatch({
      type: "delete",
      presetId: preset.id,
      id: word.id,
      token,
      now,
    });
    // A painted measured row precedes the source's 240ms collapse.
    later(
      () =>
        setRemoving((previous) =>
          previous.map((item) =>
            item === ghost ? { ...item, collapsing: true } : item,
          ),
        ),
      16,
    );
    later(
      () =>
        setRemoving((previous) =>
          previous.filter(
            (item) => item.word.id !== word.id || item.presetId !== preset.id,
          ),
        ),
      250,
    );
    closeMenu();
    scrollRef.current?.focus({ preventScroll: true });
  }
  function undo(token: string, now: number) {
    const deletion = state.deletions.find((item) => item.token === token);
    if (!deletion || deletion.dismissed || now >= deletion.expiresAt) return;
    dispatch({ type: "undo", token, now });
    setRemoving((previous) =>
      previous.filter(
        (item) =>
          item.presetId !== deletion.presetId ||
          item.word.id !== deletion.word.id,
      ),
    );
  }

  useEffect(() => {
    if (!open) return;
    function keydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        if (menu?.open) closeMenu(true);
        else if (editor) closeEditor();
        else closeInspector();
      }
      if (event.key !== "Tab") return;
      const root = menu?.open
        ? menuRef.current
        : editor
          ? editorRef.current
          : dialogRef.current;
      if (!root) return;
      const focusable = [
        ...root.querySelectorAll<HTMLElement>(
          "button:not([disabled]),input,textarea",
        ),
      ].filter((element) => element.offsetParent !== null);
      if (!menu?.open)
        focusable.push(
          ...document.querySelectorAll<HTMLButtonElement>(
            ".vi-toast:not(.vi-out) button:not([disabled])",
          ),
        );
      const first = focusable[0],
        last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    function pointerdown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !menuRef.current?.contains(event.target) &&
        !menu?.anchor.contains(event.target)
      )
        closeMenu();
    }
    const resize = () => closeMenu();
    document.addEventListener("keydown", keydown);
    document.addEventListener("pointerdown", pointerdown);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("pointerdown", pointerdown);
      window.removeEventListener("resize", resize);
    };
  });

  if (typeof document === "undefined" || (!preset && !state.deletions.length))
    return null;
  const rows: { word: VocabularyWord; ghost?: RemovingRow }[] = words.map(
    (word) => ({ word }),
  );
  for (const ghost of removing.filter((row) => row.presetId === preset?.id))
    rows.splice(Math.min(ghost.index, rows.length), 0, {
      word: ghost.word,
      ghost,
    });
  return createPortal(
    <div className="vocabulary-inspector">
      {preset && (
        <>
          <div
            className={"vi-layer" + (!closing ? " vi-open" : "")}
            inert={closing || editor !== null}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !editor)
                closeInspector();
            }}
          >
            <div
              ref={dialogRef}
              className="vi-dlg vi-pop"
              role="dialog"
              aria-modal="true"
              aria-labelledby="vocabulary-inspector-title"
              aria-describedby="vocabulary-inspector-count"
            >
              <header className="vi-pop-h">
                <div>
                  <h2 id="vocabulary-inspector-title">{preset.title}</h2>
                  <p className="vi-cnt" id="vocabulary-inspector-count">
                    {words.length} {words.length === 1 ? "word" : "words"} ·
                    Demo data
                  </p>
                </div>
                <button
                  type="button"
                  className="vi-x"
                  aria-label="Close word list"
                  onClick={closeInspector}
                >
                  <Icon name="cross" size={18} />
                </button>
              </header>
              <div
                className="vi-scroll"
                ref={scrollRef}
                tabIndex={-1}
                onScroll={() => closeMenu()}
              >
                <div className="vi-thead">
                  <span>Word</span>
                  <span>Status</span>
                  <span />
                </div>
                <div>
                  {rows.map(({ word, ghost }) => {
                    const status =
                      ghost?.status ?? wordStatus(state, preset.id, word);
                    return (
                      <div
                        key={word.id}
                        className={
                          "vi-row" +
                          (ghost?.collapsing ? " vi-removing" : "") +
                          (flash === word.id ? " vi-flash" : "")
                        }
                        data-word-id={word.id}
                        aria-hidden={ghost ? true : undefined}
                        inert={Boolean(ghost)}
                        style={
                          ghost
                            ? { height: ghost.collapsing ? 0 : ghost.height }
                            : undefined
                        }
                        onAnimationEnd={() => {
                          if (flash === word.id) setFlash(null);
                        }}
                      >
                        <div className="vi-c-w">
                          <button
                            type="button"
                            className={
                              "vi-wd" + (status === "excluded" ? " vi-ex" : "")
                            }
                            onClick={(event) =>
                              openEditor(
                                own
                                  ? { kind: "edit", word }
                                  : { kind: "view", word },
                                event.currentTarget,
                              )
                            }
                          >
                            {word.word}
                          </button>
                        </div>
                        <div className="vi-c-s">
                          <span className={"vi-chip vi-" + status}>
                            {STATUS_LABELS[status]}
                          </span>
                        </div>
                        <div className="vi-c-a">
                          <button
                            type="button"
                            className="vi-ib"
                            aria-label={"More actions for " + word.word}
                            aria-haspopup="menu"
                            aria-expanded={Boolean(
                              menu?.open && menu.word.id === word.id,
                            )}
                            onClick={(event) =>
                              showMenu(word, event.currentTarget)
                            }
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <circle cx="5" cy="12" r="1.8" />
                              <circle cx="12" cy="12" r="1.8" />
                              <circle cx="19" cy="12" r="1.8" />
                            </svg>
                          </button>
                          {own && (
                            <button
                              type="button"
                              className="vi-ib vi-del"
                              aria-label={"Delete " + word.word}
                              onClick={(event) =>
                                deleteWord(word, event, Date.now())
                              }
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {words.length === 0 && !rows.length && (
                  <p className="vi-empty">No words yet</p>
                )}
              </div>
              {own && (
                <footer className="vi-pop-f">
                  <button
                    type="button"
                    className="vi-btn vi-primary"
                    ref={addRef}
                    onClick={(event) =>
                      openEditor({ kind: "add" }, event.currentTarget)
                    }
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Word
                  </button>
                </footer>
              )}
            </div>
          </div>
          {editor && (
            <VocabularyWordDialog
              key={editor.kind === "add" ? "add" : editor.word.id}
              mode={editor}
              open={!editorClosing}
              dialogRef={editorRef}
              onClose={closeEditor}
              onSave={saveWord}
            />
          )}
          {menu && (
            <div
              className={"vi-menu" + (menu.open ? " vi-open" : "")}
              ref={menuRef}
              role="menu"
              inert={!menu.open}
              style={{ left: menu.left, top: menu.top }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  dispatch({
                    type: "toggle-exclusion",
                    presetId: preset.id,
                    id: menu.word.id,
                  });
                  closeMenu(true);
                }}
              >
                {wordStatus(state, preset.id, menu.word) === "excluded"
                  ? "Unexclude"
                  : "Exclude"}
              </button>
            </div>
          )}
        </>
      )}
      <div
        className="vi-toasts"
        role="status"
        aria-live="polite"
        aria-atomic="false"
      >
        {state.deletions.map((deletion) => (
          <div
            key={deletion.token}
            className={"vi-toast" + (deletion.dismissed ? " vi-out" : "")}
          >
            <span>“{deletion.word.word}” deleted</span>
            <button
              type="button"
              disabled={deletion.dismissed}
              onClick={() => undo(deletion.token, Date.now())}
            >
              Undo
            </button>
            <i aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
