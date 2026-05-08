import type { Exercise } from '../types';

const labels: Record<Exercise['category'], string> = {
  pull: 'Pull',
  row: 'Row',
  legs: 'Legs',
  core: 'Core',
  shoulders: 'Shoulders',
  power: 'Power',
  arms: 'Arms',
};

export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  const videoUrl =
    exercise.videoUrl?.trim() ||
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exercise.name} ${exercise.equipment} proper form`)}`;
  const cues =
    exercise.guideCues && exercise.guideCues.length > 0
      ? exercise.guideCues
      : [`Use ${exercise.equipment}`, 'Move with control', 'Keep the movement pain-free'];

  if (exercise.imageUrl?.trim()) {
    return (
      <div className="exercise-guide">
        <img className="exercise-image" src={exercise.imageUrl} alt={exercise.name} />
        <GuideDetails category={labels[exercise.category]} cues={cues} videoUrl={videoUrl} />
      </div>
    );
  }

  return (
    <div className="exercise-guide" aria-label={`${exercise.name} guide`}>
      <div className={`exercise-placeholder exercise-placeholder-${exercise.category}`}>
        <div>
          <span>{labels[exercise.category]}</span>
          <strong>{exercise.name}</strong>
        </div>
        <div className="motion-diagram" aria-hidden="true">
          <i />
          <b />
          <em />
        </div>
      </div>
      <GuideDetails category={labels[exercise.category]} cues={cues} videoUrl={videoUrl} />
    </div>
  );
}

function GuideDetails({ category, cues, videoUrl }: { category: string; cues: string[]; videoUrl: string }) {
  return (
    <div className="guide-details">
      <span className="guide-chip">{category} guide</span>
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
