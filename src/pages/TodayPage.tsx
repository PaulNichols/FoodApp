import { useEffect, useMemo, useState } from 'react';
import { DateSelector } from '../components/DateSelector';
import { MealCard } from '../components/MealCard';
import { SnackList } from '../components/SnackList';
import { SupplementCard } from '../components/SupplementCard';
import type { FoodLogDay, FoodPhoto, MealLog, MealSlot, StorageSettings } from '../models/foodLog';
import { createDefaultFoodLogDay, normalizeFoodLogDay } from '../models/foodLog';
import { GitHubFoodLogRepository } from '../repositories/GitHubFoodLogRepository';
import type { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import {
  addDays,
  getFoodLogJsonPath,
  getOneMonthAgoDate,
  getTodayInBrisbane,
  toBrisbaneTimestamp,
} from '../services/dateService';

interface TodayPageProps {
  settings: StorageSettings;
  githubToken: string;
  localRepository: LocalFoodLogRepository;
  onGitHubTokenChange: (token: string) => void;
}

export function TodayPage({ settings, githubToken, localRepository, onGitHubTokenChange }: TodayPageProps) {
  const [date, setDate] = useState(getTodayInBrisbane);
  const [day, setDay] = useState<FoodLogDay>(() => createDefaultFoodLogDay(date, toBrisbaneTimestamp()));
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const githubRepository = useMemo(
    () => new GitHubFoodLogRepository(settings, githubToken),
    [githubToken, settings],
  );

  useEffect(() => {
    let isActive = true;

    const loadDay = async () => {
      setIsLoading(true);
      setStatus('');
      setPhotos([]);

      try {
        const savedDay = await localRepository.getDay(date);

        if (isActive) {
          setDay(normalizeFoodLogDay(savedDay ?? createDefaultFoodLogDay(date, toBrisbaneTimestamp())));
        }
      } catch (error) {
        if (isActive) {
          setStatus(error instanceof Error ? error.message : 'Unable to load this day.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDay();

    return () => {
      isActive = false;
    };
  }, [date, localRepository]);

  const updateDay = (nextDay: FoodLogDay) => {
    setDay(normalizeFoodLogDay({ ...nextDay, updatedAt: toBrisbaneTimestamp() }));
  };

  const updateMeal = (slot: MealSlot, nextMeal: MealLog) => {
    updateDay({ ...day, meals: day.meals.map((meal) => (meal.slot === slot ? nextMeal : meal)) });
  };

  const upsertPhoto = (photo: FoodPhoto) => {
    setPhotos((current) => [...current.filter((item) => item.path !== photo.path), photo]);
  };

  const save = async () => {
    setIsLoading(true);
    setStatus('Saving...');

    try {
      const nextDay = normalizeFoodLogDay({ ...day, updatedAt: toBrisbaneTimestamp() });
      let tokenForSave = githubToken.trim();

      if (!tokenForSave) {
        const enteredToken = window.prompt(
          'Enter your fine-grained GitHub token for FoodApp. It is stored in this browser session only.',
        );

        tokenForSave = enteredToken?.trim() ?? '';

        if (!tokenForSave) {
          setStatus('Save cancelled. A GitHub token is required so the JSON can be written to this repo.');
          return;
        }

        onGitHubTokenChange(tokenForSave);
      }

      await localRepository.saveDay(nextDay, photos);
      const cutoffDate = getOneMonthAgoDate();
      await runCleanup(() => localRepository.cleanupOlderThan(cutoffDate));

      const repository =
        tokenForSave === githubToken.trim() ? githubRepository : new GitHubFoodLogRepository(settings, tokenForSave);
      await repository.saveDay(nextDay, photos);
      const githubCleanup = await runCleanup(() => repository.cleanupOlderThan(cutoffDate));
      const photoCount = photos.length;
      setStatus(
        `Saved to GitHub: ${getFoodLogJsonPath(nextDay.date)}${
          photoCount > 0 ? ` and ${photoCount} photo${photoCount === 1 ? '' : 's'}` : ''
        }. ${getCleanupMessage(githubCleanup, 'GitHub', cutoffDate)} Codex can read /data and /photos from this repo.`,
      );
      setDay(nextDay);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <DateSelector
        value={date}
        onChange={setDate}
        onPrevious={() => setDate(addDays(date, -1))}
        onNext={() => setDate(addDays(date, 1))}
      />

      <SupplementCard
        supplements={day.supplements}
        onChange={(supplements) => updateDay({ ...day, supplements })}
      />

      {day.meals.map((meal) => (
        <MealCard
          key={meal.slot}
          date={date}
          meal={meal}
          photo={photos.find((photo) => photo.path === meal.photoPath)}
          onChange={(nextMeal) => updateMeal(meal.slot, nextMeal)}
          onPhotoSelected={upsertPhoto}
          onError={setStatus}
        />
      ))}

      <SnackList
        date={date}
        snacks={day.snacks}
        photos={photos}
        onChange={(snacks) => updateDay({ ...day, snacks })}
        onPhotoSelected={upsertPhoto}
        onError={setStatus}
      />

      <section className="panel">
        <div className="panel-title">
          <h2>Daily notes</h2>
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea
            value={day.dailyNotes}
            placeholder="Hungry after swimming, ate out, low energy, cravings, missed shake, extra protein, social meal..."
            onChange={(event) => updateDay({ ...day, dailyNotes: event.target.value })}
          />
        </label>
      </section>

      <section className="panel save-panel">
        {status && (
          <p role="status" className="status">
            {status}
          </p>
        )}

        <button type="button" className="save-button" onClick={() => void save()} disabled={isLoading}>
          Save
        </button>
      </section>
    </div>
  );
}

interface CleanupResult {
  count: number;
  error: string | null;
}

const runCleanup = async (cleanup: () => Promise<number>): Promise<CleanupResult> => {
  try {
    return { count: await cleanup(), error: null };
  } catch (error) {
    return { count: 0, error: error instanceof Error ? error.message : 'Cleanup failed.' };
  }
};

const getCleanupMessage = (cleanup: CleanupResult, label: string, cutoffDate?: string): string => {
  if (cleanup.error) {
    return `Cleanup warning: ${cleanup.error}.`;
  }

  const cutoffMessage = cutoffDate ? ` before ${cutoffDate}` : '';

  return `Removed ${cleanup.count} old ${label} item${cleanup.count === 1 ? '' : 's'}${cutoffMessage}.`;
};
