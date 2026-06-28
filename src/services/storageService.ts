import { defaultPrograms } from '../data/defaultPrograms';
import type { ExportData, Program, WorkoutEntry } from '../types';

const APP_VERSION = '0.1.0';
const PROGRAMS_KEY = 'swimGymTracker.programs';
const HISTORY_KEY = 'swimGymTracker.history';
const CATEGORIES = new Set(['pull', 'row', 'legs', 'core', 'shoulders', 'power', 'arms', 'mobility']);

const cloneDefaults = (): Program[] => structuredClone(defaultPrograms);
const defaultExercises = new Map(defaultPrograms.flatMap((program) => program.exercises.map((exercise) => [exercise.id, exercise])));
const defaultProgramsById = new Map(defaultPrograms.map((program) => [program.id, program]));

const enrichPrograms = (programs: Program[]): Program[] =>
  programs.map((program) => ({
    ...program,
    trainingNote: program.trainingNote || defaultProgramsById.get(program.id)?.trainingNote,
    exercises: program.exercises.map((exercise) => {
      const defaults = defaultExercises.get(exercise.id);

      return {
        ...exercise,
        guideCues: exercise.guideCues && exercise.guideCues.length > 0 ? exercise.guideCues : defaults?.guideCues,
        videoUrl: exercise.videoUrl || defaults?.videoUrl,
        swimDescription: exercise.swimDescription || defaults?.swimDescription,
      };
    }),
  }));

const appendMissingDefaultPrograms = (programs: Program[]): Program[] => {
  const existingProgramIds = new Set(programs.map((program) => program.id));
  const missingPrograms = defaultPrograms.filter((program) => !existingProgramIds.has(program.id));

  return missingPrograms.length > 0 ? [...programs, ...structuredClone(missingPrograms)] : programs;
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T,>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

const hasValidProgramShape = (programs: unknown): programs is Program[] =>
  Array.isArray(programs) &&
  programs.every(
    (program) =>
      typeof program === 'object' &&
      program !== null &&
      'id' in program &&
      typeof program.id === 'string' &&
      'name' in program &&
      typeof program.name === 'string' &&
      'description' in program &&
      typeof program.description === 'string' &&
      (program.trainingNote === undefined || typeof program.trainingNote === 'string') &&
      'exercises' in program &&
      Array.isArray((program as Program).exercises) &&
      (program as Program).exercises.every(
        (exercise) =>
          typeof exercise.id === 'string' &&
          typeof exercise.name === 'string' &&
          typeof exercise.equipment === 'string' &&
          typeof exercise.unit === 'string' &&
          typeof exercise.category === 'string' &&
          CATEGORIES.has(exercise.category) &&
          (exercise.imageUrl === undefined || typeof exercise.imageUrl === 'string') &&
          (exercise.videoUrl === undefined || typeof exercise.videoUrl === 'string') &&
          (exercise.swimDescription === undefined || typeof exercise.swimDescription === 'string') &&
          (exercise.guideCues === undefined ||
            (Array.isArray(exercise.guideCues) && exercise.guideCues.every((cue) => typeof cue === 'string'))),
      ),
  );

const hasValidHistoryShape = (history: unknown): history is WorkoutEntry[] =>
  Array.isArray(history) &&
  history.every(
    (entry) =>
      typeof entry === 'object' &&
      entry !== null &&
      'id' in entry &&
      typeof entry.id === 'string' &&
      'exerciseId' in entry &&
      typeof entry.exerciseId === 'string' &&
      'exerciseName' in entry &&
      typeof entry.exerciseName === 'string' &&
      'programName' in entry &&
      typeof entry.programName === 'string' &&
      'completedAt' in entry &&
      typeof entry.completedAt === 'string' &&
      'value' in entry &&
      typeof entry.value === 'string' &&
      'unit' in entry &&
      typeof entry.unit === 'string',
  );

export const storageService = {
  getPrograms(): Program[] {
    const programs = readJson<Program[] | null>(PROGRAMS_KEY, null);
    if (!hasValidProgramShape(programs)) {
      const defaults = cloneDefaults();
      writeJson(PROGRAMS_KEY, defaults);
      return defaults;
    }

    const enriched = appendMissingDefaultPrograms(enrichPrograms(programs));
    writeJson(PROGRAMS_KEY, enriched);
    return enriched;
  },

  savePrograms(programs: Program[]): void {
    writeJson(PROGRAMS_KEY, programs);
  },

  resetToDefaults(): Program[] {
    const defaults = cloneDefaults();
    writeJson(PROGRAMS_KEY, defaults);
    return defaults;
  },

  getWorkoutHistory(): WorkoutEntry[] {
    const history = readJson<WorkoutEntry[] | null>(HISTORY_KEY, null);
    return hasValidHistoryShape(history) ? history : [];
  },

  saveWorkoutHistory(history: WorkoutEntry[]): void {
    writeJson(HISTORY_KEY, history);
  },

  saveWorkoutEntry(entry: WorkoutEntry): void {
    const existing = this.getWorkoutHistory();
    writeJson(HISTORY_KEY, [...existing, entry]);
  },

  upsertWorkoutEntry(entry: WorkoutEntry): void {
    const existing = this.getWorkoutHistory();
    const index = existing.findIndex((current) => current.id === entry.id);

    if (index === -1) {
      writeJson(HISTORY_KEY, [...existing, entry]);
      return;
    }

    const next = [...existing];
    next[index] = entry;
    writeJson(HISTORY_KEY, next);
  },

  saveWorkoutEntries(entries: WorkoutEntry[]): void {
    if (entries.length === 0) {
      return;
    }

    const existing = this.getWorkoutHistory();
    writeJson(HISTORY_KEY, [...existing, ...entries]);
  },

  getLatestEntryForExercise(exerciseId: string): WorkoutEntry | undefined {
    return this.getWorkoutHistory()
      .filter((entry) => entry.exerciseId === exerciseId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0];
  },

  exportData(): ExportData {
    return {
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      programs: this.getPrograms(),
      workoutHistory: this.getWorkoutHistory(),
    };
  },

  importData(data: unknown): boolean {
    if (
      typeof data !== 'object' ||
      data === null ||
      !('programs' in data) ||
      !('workoutHistory' in data) ||
      !hasValidProgramShape((data as ExportData).programs) ||
      !hasValidHistoryShape((data as ExportData).workoutHistory)
    ) {
      return false;
    }

    writeJson(PROGRAMS_KEY, (data as ExportData).programs);
    writeJson(HISTORY_KEY, (data as ExportData).workoutHistory);
    return true;
  },
};
