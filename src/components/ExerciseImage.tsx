import type { Exercise } from '../types';

const labels: Record<Exercise['category'], string> = {
  pull: 'Pull',
  row: 'Row',
  legs: 'Legs',
  core: 'Core',
  shoulders: 'Shoulders',
  power: 'Power',
  arms: 'Arms',
  mobility: 'Mobility',
};

export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  const videoUrl =
    exercise.videoUrl?.trim() ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} ${exercise.equipment} proper form`)}`;
  const cues =
    exercise.guideCues && exercise.guideCues.length > 0
      ? exercise.guideCues
      : [`Use ${exercise.equipment}`, 'Move with control', 'Keep the movement pain-free'];

  return (
    <div className="exercise-guide" aria-label={`${exercise.name} guide`}>
      <GuideDetails category={labels[exercise.category]} cues={cues} videoUrl={videoUrl} />
    </div>
  );
}

function GuideDetails({ category, cues, videoUrl }: { category: string; cues: string[]; videoUrl: string }) {
  return (
    <div className="guide-details">
      <span className="guide-chip">{category} cues</span>
      <ul>
        {cues.map((cue) => (
          <li key={cue}>{cue}</li>
        ))}
      </ul>
      <a className="video-link" href={videoUrl} target="_blank" rel="noreferrer">
        Watch form videos
      </a>
    </div>
  );
}
