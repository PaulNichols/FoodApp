import { useEffect, useState } from 'react';
import { DashboardSummary } from '../components/DashboardSummary';
import type { FoodLogDay, StorageSettings } from '../models/foodLog';
import { normalizeFoodLogDay } from '../models/foodLog';
import { GitHubFoodLogRepository } from '../repositories/GitHubFoodLogRepository';
import type { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import { getLastNDates } from '../services/dateService';

interface DashboardPageProps {
  settings: StorageSettings;
  githubToken: string;
  localRepository: LocalFoodLogRepository;
}

export function DashboardPage({ settings, githubToken, localRepository }: DashboardPageProps) {
  const [days, setDays] = useState<FoodLogDay[]>([]);
  const [status, setStatus] = useState('Loading dashboard...');

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const localDays = await localRepository.getRecentDays(7);
        let recentDays = localDays;
        let nextStatus = recentDays.length > 0 ? 'Last 7 days loaded.' : 'No saved days yet.';

        if (githubToken.trim()) {
          try {
            const githubRepository = new GitHubFoodLogRepository(settings, githubToken);
            const githubDays = (await githubRepository.getRecentDays(7)).map(normalizeFoodLogDay);
            recentDays = githubDays;
            nextStatus = recentDays.length > 0 ? 'Last 7 days loaded.' : 'No saved days yet.';

            await Promise.all(githubDays.map((day) => localRepository.saveDay(day, [])));
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unable to load GitHub dashboard data.';
            nextStatus = `Last 7 days loaded. GitHub refresh failed: ${message}`;
          }
        }

        if (isActive) {
          setDays(recentDays);
          setStatus(nextStatus);
        }
      } catch (error) {
        if (isActive) {
          setStatus(error instanceof Error ? error.message : 'Unable to load dashboard.');
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, [githubToken, localRepository, settings]);

  const byDate = new Map(days.map((day) => [day.date, day]));

  return (
    <div className="page-stack">
      <DashboardSummary days={days} />

      <section className="panel">
        <div className="panel-title">
          <h2>Last 7 days</h2>
        </div>
        <p role="status" className="status">
          {status}
        </p>

        <div className="day-list">
          {getLastNDates(7).map((date) => {
            const day = byDate.get(date);
            const breakfast = day?.meals.find((meal) => meal.slot === 'breakfast');
            const lunch = day?.meals.find((meal) => meal.slot === 'lunch');
            const evening = day?.meals.find((meal) => meal.slot === 'evening-meal');
            const photoCount = day
              ? [...day.meals.map((meal) => meal.photoPath), ...day.snacks.map((snack) => snack.photoPath)].filter(
                  Boolean,
                ).length
              : 0;
            const estimatedCalories = day ? getEstimatedCalories(day) : null;

            return (
              <article className="day-row" key={date}>
                <strong>{date}</strong>
                {day ? (
                  <dl>
                    <div>
                      <dt>Supplements</dt>
                      <dd>{day.supplements.morningSupplementsTaken ? 'Done' : 'Missed'}</dd>
                    </div>
                    <div>
                      <dt>Breakfast</dt>
                      <dd>{breakfast?.usedDefault ? 'Default' : 'Replaced'}</dd>
                    </div>
                    <div>
                      <dt>Lunch</dt>
                      <dd>{lunch?.usedDefault ? 'Default' : 'Replaced'}</dd>
                    </div>
                    <div>
                      <dt>Evening</dt>
                      <dd>{evening?.usedDefault ? 'Default' : 'Replaced'}</dd>
                    </div>
                    <div>
                      <dt>Snacks</dt>
                      <dd>{day.snacks.length}</dd>
                    </div>
                    <div>
                      <dt>Photos</dt>
                      <dd>{photoCount > 0 ? 'Yes' : 'No'}</dd>
                    </div>
                    <div>
                      <dt>Calories</dt>
                      <dd>{formatCalories(estimatedCalories)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="muted">No saved log.</p>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const getEstimatedCalories = (day: FoodLogDay): number | null => {
  const calories = [...day.meals, ...day.snacks]
    .map((item) => item.analysis?.calories)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

  if (calories.length === 0) {
    return null;
  }

  return calories.reduce((total, value) => total + value, 0);
};

const formatCalories = (calories: number | null): string =>
  calories === null ? 'No estimate' : Math.round(calories).toLocaleString('en-AU');
