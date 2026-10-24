import type { QuestionSummary, Subject } from "./question-bank.types";
import { summarize } from "./question-bank.logic";
import { Icon } from "./icon";
export function SubjectCard({
  subject,
  questions,
  onSelect,
}: {
  subject: Subject;
  questions: QuestionSummary[];
  onSelect: (title: string, topicIds: string[]) => void;
}) {
  const topicIds = subject.topics.map((topic) => topic.id);
  const items = questions.filter((question) =>
    topicIds.includes(question.topicId),
  );
  const progress = summarize(items);
  return (
    <article className="subject-card" aria-labelledby={`${subject.id}-title`}>
      <div className="subject-heading">
        <h3 id={`${subject.id}-title`}>{subject.name}</h3>
        <button
          className="subject-action"
          aria-label={`Preview ${subject.name}`}
          disabled={!items.length}
          onClick={() => onSelect(subject.name, topicIds)}
        >
          <Icon name="play" size={18} />
        </button>
      </div>
      <div className="subject-progress">
        <progress
          value={progress.answered}
          max={progress.total || 1}
          aria-label={`${subject.name} progress`}
        />
        <span>
          {progress.answered}
          <span className="muted">/{progress.total}</span>
        </span>
      </div>
      <ul className="topic-list">
        {subject.topics.map((topic) => {
          const counts = summarize(
            items.filter((question) => question.topicId === topic.id),
          );
          return (
            <li key={topic.id}>
              <button
                disabled={!counts.total}
                onClick={() => onSelect(topic.name, [topic.id])}
                aria-label={`Preview ${topic.name}, ${counts.answered} of ${counts.total} solved`}
              >
                <span className="topic-name">{topic.name}</span>
                <span className="topic-meter">
                  <progress
                    value={counts.answered}
                    max={counts.total || 1}
                    aria-hidden="true"
                  />
                  <span>
                    {counts.answered}
                    <span className="muted">/{counts.total}</span>
                  </span>
                </span>
                <Icon name="chevron" size={12} />
              </button>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
