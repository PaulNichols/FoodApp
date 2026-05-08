import type { WorkoutEntry } from '../types';

interface WorkoutCompletePageProps {
  entries: WorkoutEntry[];
  onHome: () => void;
  onHistory: () => void;
}

export function WorkoutCompletePage({ entries, onHome, onHistory }: WorkoutCompletePageProps) {
  return (
    <main className="screen">
      <section className="complete-hero">
        <p className="eyebrow">Workout Complete</p>
        <h1>Session saved</h1>
        <p>{entries.length} exercises recorded.</p>
      </section>

      <section className="panel">
        <h2>Today</h2>
        <div className="summary-list">
          {entries.map((entry) => (
            <article key={entry.id} className="summary-row">
              <div>
                <strong>{entry.exerciseName}</strong>
                <span>{entry.equipment}</span>
              </div>
              <b>
                {entry.value || '-'} {entry.unit}
              </b>
            </article>
          ))}
        </div>
      </section>

      <div className="button-row">
        <button className="primary-button" type="button" onClick={onHome}>
          Home
        </button>
        <button className="secondary-button" type="button" onClick={onHistory}>
          History
        </button>
      </div>
    </main>
  );
}
