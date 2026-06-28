import { useState } from 'react';
import { createId } from '../services/idService';
import { storageService } from '../services/storageService';
import type { Exercise, ExerciseCategory, Program } from '../types';

interface AdminPageProps {
  programs: Program[];
  onProgramsChanged: (programs: Program[]) => void;
  onBack: () => void;
}

const categories: ExerciseCategory[] = ['pull', 'row', 'legs', 'core', 'shoulders', 'power', 'arms', 'mobility'];

const emptyExercise = (): Exercise => ({
  id: createId('exercise'),
  name: 'New exercise',
  equipment: '',
  unit: 'kg',
  category: 'pull',
  imageUrl: '',
  videoUrl: '',
  swimDescription: '',
  guideCues: ['Set up safely', 'Move with control', 'Stop before form breaks'],
});

export function AdminPage({ programs, onProgramsChanged, onBack }: AdminPageProps) {
  const [selectedProgramId, setSelectedProgramId] = useState(programs[0]?.id ?? '');
  const selectedProgram = programs.find((program) => program.id === selectedProgramId) ?? programs[0];

  const savePrograms = (nextPrograms: Program[]) => {
    storageService.savePrograms(nextPrograms);
    onProgramsChanged(nextPrograms);
  };

  const updateExercise = (programId: string, exerciseId: string, changes: Partial<Exercise>) => {
    savePrograms(
      programs.map((program) =>
        program.id === programId
          ? {
              ...program,
              exercises: program.exercises.map((exercise) => (exercise.id === exerciseId ? { ...exercise, ...changes } : exercise)),
            }
          : program,
      ),
    );
  };

  const addExercise = (programId: string) => {
    savePrograms(
      programs.map((program) =>
        program.id === programId ? { ...program, exercises: [...program.exercises, emptyExercise()] } : program,
      ),
    );
  };

  const deleteExercise = (programId: string, exerciseId: string) => {
    if (!window.confirm('Delete this exercise? Existing history will remain.')) {
      return;
    }

    savePrograms(
      programs.map((program) =>
        program.id === programId
          ? { ...program, exercises: program.exercises.filter((exercise) => exercise.id !== exerciseId) }
          : program,
      ),
    );
  };

  const moveExercise = (programId: string, exerciseId: string, direction: -1 | 1) => {
    const nextPrograms = programs.map((program) => {
      if (program.id !== programId) {
        return program;
      }

      const index = program.exercises.findIndex((exercise) => exercise.id === exerciseId);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= program.exercises.length) {
        return program;
      }

      const exercises = [...program.exercises];
      [exercises[index], exercises[target]] = [exercises[target], exercises[index]];
      return { ...program, exercises };
    });

    savePrograms(nextPrograms);
  };

  const resetDefaults = () => {
    if (!window.confirm('Reset Program A and Program B to defaults? Workout history will remain.')) {
      return;
    }

    const defaults = storageService.resetToDefaults();
    setSelectedProgramId(defaults[0]?.id ?? '');
    onProgramsChanged(defaults);
  };

  if (!selectedProgram) {
    return (
      <main className="screen">
        <button className="link-button" type="button" onClick={onBack}>
          Home
        </button>
        <p>No programs available.</p>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="top-bar">
        <button className="link-button" type="button" onClick={onBack}>
          Home
        </button>
        <span>Admin</span>
      </header>

      <section className="panel">
        <h1>Edit Programs</h1>
        <label>
          Program
          <select value={selectedProgram.id} onChange={(event) => setSelectedProgramId(event.target.value)}>
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name} - {program.description}
              </option>
            ))}
          </select>
        </label>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => addExercise(selectedProgram.id)}>
            Add Exercise
          </button>
          <button className="danger-button" type="button" onClick={resetDefaults}>
            Reset to Default Programs
          </button>
        </div>
      </section>

      <section className="exercise-edit-list">
        {selectedProgram.exercises.map((exercise, index) => (
          <article className="exercise-editor" key={exercise.id}>
            <div className="editor-heading">
              <strong>
                {index + 1}. {exercise.name || 'Unnamed exercise'}
              </strong>
              <div className="icon-actions">
                <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => moveExercise(selectedProgram.id, exercise.id, -1)}>
                  Up
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={index === selectedProgram.exercises.length - 1}
                  onClick={() => moveExercise(selectedProgram.id, exercise.id, 1)}
                >
                  Down
                </button>
              </div>
            </div>

            <label>
              Name
              <input value={exercise.name} onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { name: event.target.value })} />
            </label>
            <label>
              Equipment
              <input
                value={exercise.equipment}
                onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { equipment: event.target.value })}
              />
            </label>
            <div className="form-grid">
              <label>
                Unit
                <input value={exercise.unit} onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { unit: event.target.value })} />
              </label>
              <label>
                Category
                <select
                  value={exercise.category}
                  onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { category: event.target.value as ExerciseCategory })}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Image URL
              <input
                value={exercise.imageUrl ?? ''}
                placeholder="Optional"
                onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { imageUrl: event.target.value })}
              />
            </label>
            <label>
              YouTube URL
              <input
                value={exercise.videoUrl ?? ''}
                placeholder="Optional YouTube video or search URL"
                onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { videoUrl: event.target.value })}
              />
            </label>
            <label>
              Swimming benefit
              <textarea
                rows={3}
                value={exercise.swimDescription ?? ''}
                placeholder="How this helps swimming and which stroke it supports"
                onChange={(event) => updateExercise(selectedProgram.id, exercise.id, { swimDescription: event.target.value })}
              />
            </label>
            <label>
              Visual cues
              <textarea
                rows={3}
                value={(exercise.guideCues ?? []).join('\n')}
                placeholder="One cue per line"
                onChange={(event) =>
                  updateExercise(selectedProgram.id, exercise.id, {
                    guideCues: event.target.value
                      .split('\n')
                      .map((cue) => cue.trim())
                      .filter(Boolean),
                  })
                }
              />
            </label>
            <button className="danger-button" type="button" onClick={() => deleteExercise(selectedProgram.id, exercise.id)}>
              Delete Exercise
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}
