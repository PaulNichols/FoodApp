import { useMemo, useState } from 'react';
import { storageService } from '../services/storageService';

interface HistoryPageProps {
  onBack: () => void;
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const numericValue = (value: string): number | undefined => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export function HistoryPage({ onBack }: HistoryPageProps) {
  const [exerciseFilter, setExerciseFilter] = useState('all');
  const history = useMemo(
    () => storageService.getWorkoutHistory().sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()),
    [],
  );

  const exercises = Array.from(new Set(history.map((entry) => entry.exerciseName))).sort((a, b) => a.localeCompare(b));
  const filtered = exerciseFilter === 'all' ? history : history.filter((entry) => entry.exerciseName === exerciseFilter);
  const oldest = filtered.at(-1);
  const newest = filtered[0];
  const firstNumber = oldest ? numericValue(oldest.value) : undefined;
  const latestNumber = newest ? numericValue(newest.value) : undefined;
  const change = firstNumber !== undefined && latestNumber !== undefined ? latestNumber - firstNumber : undefined;

  return (
    <main className="screen">
      <header className="top-bar">
        <button className="link-button" type="button" onClick={onBack}>
          Home
        </button>
        <span>History</span>
      </header>

      <section className="panel">
        <h1>History</h1>
        <label>
          Exercise
          <select value={exerciseFilter} onChange={(event) => setExerciseFilter(event.target.value)}>
            <option value="all">All exercises</option>
            {exercises.map((exercise) => (
              <option key={exercise} value={exercise}>
                {exercise}
              </option>
            ))}
          </select>
        </label>

        {newest ? (
          <div className="trend-strip">
            <strong>Most recent: {`${newest.value || '-'} ${newest.unit}`}</strong>
            {exerciseFilter !== 'all' && change !== undefined && (
              <span>
                Change over time: {change > 0 ? '+' : ''}
                {change} {newest.unit}
              </span>
            )}
          </div>
        ) : (
          <p className="muted">No entries yet.</p>
        )}
      </section>

      <section className="history-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Program</th>
              <th>Exercise</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.completedAt)}</td>
                <td>{entry.programName}</td>
                <td>{entry.exerciseName}</td>
                <td>{entry.value || '-'}</td>
                <td>{entry.unit}</td>
                <td>{entry.notes ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
