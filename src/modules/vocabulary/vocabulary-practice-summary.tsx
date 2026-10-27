import type { PracticeEntry } from "./vocabulary-practice-state";

export function VocabularyBookmark({
  entry,
  saved,
  pulse = 0,
  onToggle,
}: {
  entry: PracticeEntry;
  saved: boolean;
  pulse?: number;
  onToggle: (entry: PracticeEntry) => void;
}) {
  return (
    <button
      type="button"
      className={
        "vpr-mark" + (saved ? " vpr-on" : "") + (pulse ? " vpr-pop" : "")
      }
      aria-label={"Save " + entry.word.word}
      aria-pressed={saved}
      data-save={entry.key}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(entry);
      }}
    >
      <svg
        key={pulse}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 4h12v17l-6-4-6 4z" />
      </svg>
    </button>
  );
}
export function VocabularyPracticeSummary({
  reviewed,
  total,
  missed,
  savedKeys,
  pulses,
  onToggleSave,
  onSaveAll,
  onRedo,
  onExit,
}: {
  reviewed: number;
  total: number;
  missed: readonly PracticeEntry[];
  savedKeys: ReadonlySet<string>;
  pulses: Readonly<Record<string, number>>;
  onToggleSave: (entry: PracticeEntry) => void;
  onSaveAll: () => void;
  onRedo: () => void;
  onExit: () => void;
}) {
  const all =
    missed.length > 0 && missed.every((entry) => savedKeys.has(entry.key));
  return (
    <section className="vpr-sum" aria-label="Practice summary">
      <div className="vpr-stats">
        <div className="vpr-stat-row">
          <div className="vpr-stat">
            <div className="vpr-lbl">Reviewed</div>
            <div className="vpr-num">
              {reviewed}
              <small>of {total}</small>
            </div>
          </div>
          <div className="vpr-stat">
            <div className="vpr-lbl">Missed</div>
            <div className="vpr-num">{missed.length}</div>
          </div>
        </div>
        <div className="vpr-acts">
          {missed.length > 0 && (
            <button
              type="button"
              className="vpr-btn vpr-primary"
              onClick={onRedo}
            >
              Go over the {missed.length} missed{" "}
              {missed.length > 1 ? "words" : "word"}
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
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          )}
          <button type="button" className="vpr-btn" onClick={onExit}>
            Exit
          </button>
        </div>
      </div>
      {missed.length > 0 && (
        <div className="vpr-list">
          <div className="vpr-list-h">
            <h2>Missed</h2>
            <button
              type="button"
              className="vpr-saveall"
              aria-disabled={all}
              onClick={onSaveAll}
            >
              <span className="vpr-t" key={String(all)}>
                {all ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m5 12 5 5 9-10" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"

                    aria-hidden="true"
                  >
                    <path d="M6 4h12v17l-6-4-6 4z" />
                  </svg>
                )}
                {all ? "All in My Words" : "Save All"}
              </span>
            </button>
          </div>
          <div>
            {missed.map((entry) => (
              <div className="vpr-row" key={entry.key}>
                <div>
                  <b>{entry.word.word}</b>{" "}
                  <span className="vpr-pos">{entry.word.partOfSpeech}</span>
                  <p className="vpr-d">{entry.word.definition}</p>
                </div>
                <VocabularyBookmark
                  entry={entry}
                  saved={savedKeys.has(entry.key)}
                  pulse={pulses[entry.key]}
                  onToggle={onToggleSave}
                />
              </div>
            ))}
          </div>
          <p className="vpr-note">
            Saved words come back in your word reviews.
          </p>
        </div>
      )}
    </section>
  );
}
