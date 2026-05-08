import { useState } from 'react';
import { ExerciseImage } from '../components/ExerciseImage';
import { createId } from '../services/idService';
import { storageService } from '../services/storageService';
import type { ExerciseDraft, Program, WorkoutEntry } from '../types';

interface ProgramPageProps {
  program: Program;
  onBack: () => void;
  onComplete: (entries: WorkoutEntry[]) => void;
}

export function ProgramPage({ program, onBack, onComplete }: ProgramPageProps) {
  const [index, setIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, ExerciseDraft>>({});
  const [entryIds, setEntryIds] = useState<Record<string, string>>({});
  const [summaryEntries, setSummaryEntries] = useState<Record<string, WorkoutEntry>>({});

  const exercise = program.exercises[index];
  if (!exercise) {
    return (
      <main className="screen">
        <header className="top-bar">
          <button className="link-button" type="button" onClick={onBack}>
            Home
          </button>
          <span>{program.name}</span>
        </header>
        <section className="panel">
          <h1>No exercises</h1>
          <p className="muted">Add exercises in Admin / Edit Programs before starting this program.</p>
        </section>
      </main>
    );
  }

  const latestEntry = storageService.getLatestEntryForExercise(exercise.id);
  const draft = drafts[exercise.id] ?? { value: '', unit: exercise.unit, notes: '' };
  const progressText = `Exercise ${index + 1} of ${program.exercises.length}`;

  const updateDraft = (changes: Partial<ExerciseDraft>) => {
    setDrafts((current) => ({
      ...current,
      [exercise.id]: {
        value: draft.value,
        unit: draft.unit,
        notes: draft.notes,
        ...changes,
      },
    }));
  };

  const saveCurrent = (): WorkoutEntry => {
    const entryId = entryIds[exercise.id] ?? createId('entry');
    const entry: WorkoutEntry = {
      id: entryId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      programId: program.id,
      programName: program.name,
      equipment: exercise.equipment,
      completedAt: new Date().toISOString(),
      value: draft.value.trim(),
      unit: draft.unit.trim() || exercise.unit,
      notes: draft.notes.trim() || undefined,
    };

    storageService.upsertWorkoutEntry(entry);
    setEntryIds((current) => ({ ...current, [exercise.id]: entryId }));
    setSummaryEntries((current) => ({ ...current, [exercise.id]: entry }));
    return entry;
  };

  const saveAndNext = () => {
    saveCurrent();
    setIndex((current) => Math.min(current + 1, program.exercises.length - 1));
  };

  const finishProgram = () => {
    const finalEntry = saveCurrent();
    const allEntries = { ...summaryEntries, [exercise.id]: finalEntry };
    onComplete(program.exercises.map((item) => allEntries[item.id]).filter(Boolean));
  };

  return (
    <main className="screen">
      <header className="top-bar">
        <button className="link-button" type="button" onClick={onBack}>
          Home
        </button>
        <span>{program.name}</span>
      </header>

      <section className="progress-block">
        <p>{progressText}</p>
        <progress value={index + 1} max={program.exercises.length} />
      </section>

      <section className="exercise-card">
        <ExerciseImage exercise={exercise} />
        <p className="equipment">{exercise.equipment}</p>
        <h1>{exercise.name}</h1>
        <p className="last-time">
          {latestEntry && latestEntry.value ? `Last time: ${latestEntry.value} ${latestEntry.unit}` : 'No previous entry'}
        </p>

        <label>
          Today
          <input
            inputMode="decimal"
            placeholder={latestEntry?.value ? latestEntry.value : '35'}
            value={draft.value}
            onChange={(event) => updateDraft({ value: event.target.value })}
          />
        </label>

        <label>
          Unit
          <input value={draft.unit} onChange={(event) => updateDraft({ unit: event.target.value })} />
        </label>

        <label>
          Notes
          <textarea
            rows={3}
            placeholder="Optional"
            value={draft.notes}
            onChange={(event) => updateDraft({ notes: event.target.value })}
          />
        </label>
      </section>

      <div className="sticky-actions">
        <button className="secondary-button" type="button" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>
          Previous
        </button>
        {index < program.exercises.length - 1 ? (
          <button className="primary-button" type="button" onClick={saveAndNext}>
            Save and Next
          </button>
        ) : (
          <button className="primary-button" type="button" onClick={finishProgram}>
            Finish Program
          </button>
        )}
      </div>
    </main>
  );
}
