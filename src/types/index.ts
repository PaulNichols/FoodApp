export type Page = 'home' | 'program' | 'complete' | 'history' | 'admin' | 'data';

export type ExerciseCategory = 'pull' | 'row' | 'legs' | 'core' | 'shoulders' | 'power' | 'arms' | 'mobility';

export interface Exercise {
  id: string;
  name: string;
  equipment: string;
  unit: string;
  category: ExerciseCategory;
  imageUrl?: string;
  videoUrl?: string;
  guideCues?: string[];
  swimDescription?: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  trainingNote?: string;
  exercises: Exercise[];
}

export interface WorkoutEntry {
  id: string;
  exerciseId: string;
  exerciseName: string;
  programId: string;
  programName: string;
  equipment: string;
  completedAt: string;
  value: string;
  unit: string;
  notes?: string;
}

export interface ExportData {
  appVersion: string;
  exportedAt: string;
  programs: Program[];
  workoutHistory: WorkoutEntry[];
}

export interface ExerciseDraft {
  value: string;
  unit: string;
  notes: string;
}
