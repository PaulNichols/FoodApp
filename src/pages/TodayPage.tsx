import { useEffect, useMemo, useState } from 'react';
import { DateSelector } from '../components/DateSelector';
import { MealCard } from '../components/MealCard';
import { SnackList } from '../components/SnackList';
import { SupplementCard } from '../components/SupplementCard';
import type { FoodLogDay, FoodPhoto, MealLog, MealSlot, StorageSettings } from '../models/foodLog';
import { createDefaultFoodLogDay } from '../models/foodLog';
import { GitHubFoodLogRepository } from '../repositories/GitHubFoodLogRepository';
import type { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import { getFoodLogJsonPath, getTodayInBrisbane, toBrisbaneTimestamp } from '../services/dateService';
import { exportCurrentDay, exportLast7Days } from '../services/exportService';

interface TodayPageProps {
  settings: StorageSettings;
  githubToken: string;
  localRepository: LocalFoodLogRepository;
}

export function TodayPage({ settings, githubToken, localRepository }: TodayPageProps) {
  const [date, setDate] = useState(getTodayInBrisbane);
  const [day, setDay] = useState<FoodLogDay>(() => createDefaultFoodLogDay(date, toBrisbaneTimestamp()));
  const [photos, setPhotos] = useState<FoodPhoto[]>([]);
  const [status, setStatus] = useState('Ready.');
  const [isLoading, setIsLoading] = useState(false);

  const githubRepository = useMemo(
    () => new GitHubFoodLogRepository(settings, githubToken),
    [githubToken, settings],
  );

  useEffect(() => {
    let isActive = true;

    const loadDay = async () => {
      setIsLoading(true);
      setStatus('Loading day...');
      setPhotos([]);

      try {
        const savedDay = await localRepository.getDay(date);

        if (isActive) {
          setDay(savedDay ?? createDefaultFoodLogDay(date, toBrisbaneTimestamp()));
          setStatus(savedDay ? 'Loaded local day.' : 'Using default day.');
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
    setDay({ ...nextDay, updatedAt: toBrisbaneTimestamp() });
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
      const nextDay = { ...day, updatedAt: toBrisbaneTimestamp() };
      await localRepository.saveDay(nextDay, photos);

      if (settings.mode === 'github') {
        if (!githubToken.trim()) {
          setDay(nextDay);
          setStatus('Saved locally only. Add your GitHub token in Settings so Save can update this repo.');
          return;
        }

        await githubRepository.saveDay(nextDay, photos);
        const photoCount = photos.length;
        setStatus(
          `Saved to GitHub: ${getFoodLogJsonPath(nextDay.date)}${
            photoCount > 0 ? ` and ${photoCount} photo${photoCount === 1 ? '' : 's'}` : ''
          }. Codex can read /data and /photos from this repo.`,
        );
      } else {
        setStatus('Saved locally only. Switch Settings to GitHub repo when this day should update repository JSON.');
      }

      setDay(nextDay);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="panel hero-panel">
        <DateSelector value={date} onChange={setDate} />
        <p className="muted">Timezone: Australia/Brisbane</p>
        <p className="muted">
          In GitHub repo mode, Save writes the daily JSON and any new photos into this repository for later Codex
          analysis.
        </p>
      </section>

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
        <div>
          <p role="status" className="status">
            {status}
          </p>
          <p className="muted">Repository path: {getFoodLogJsonPath(day.date)}</p>
        </div>

        <details className="backup-actions">
          <summary>Manual backup exports</summary>
          <div className="action-grid">
            <button type="button" className="secondary" onClick={() => void exportCurrentDay(day, photos)}>
              Export day zip
            </button>
            <button type="button" className="secondary" onClick={() => void exportLast7Days(localRepository)}>
              Export week zip
            </button>
          </div>
        </details>

        <button type="button" className="save-button" onClick={() => void save()} disabled={isLoading}>
          {settings.mode === 'github' ? 'Save to GitHub' : 'Save locally'}
        </button>
      </section>
    </div>
  );
}
