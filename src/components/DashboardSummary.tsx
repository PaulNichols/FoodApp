import type { FoodLogDay } from '../models/foodLog';
import { getWaterIntakeTotalMl } from '../models/foodLog';
import { getLastNDates } from '../services/dateService';

interface DashboardSummaryProps {
  days: FoodLogDay[];
}

export function DashboardSummary({ days }: DashboardSummaryProps) {
  const dates = getLastNDates(7);
  const completedDays = days.length;
  const supplementDays = days.filter((day) => day.supplements.morningSupplementsTaken).length;
  const breakfastDays = countDefault(days, 'breakfast');
  const lunchDays = countDefault(days, 'lunch');
  const eveningDefaultDays = countDefault(days, 'evening-meal');
  const snackCount = days.reduce((total, day) => total + day.snacks.length, 0);
  const replacementMeals = days.flatMap((day) => day.meals).filter((meal) => !meal.usedDefault).length;
  const photoCount = days
    .flatMap((day) => [...day.meals.map((meal) => meal.photoPath), ...day.snacks.map((snack) => snack.photoPath)])
    .filter(Boolean).length;
  const waterDays = days
    .map((day) => getWaterIntakeTotalMl(day.waterIntake))
    .filter((value): value is number => value !== null);
  const averageWaterMl =
    waterDays.length === 0 ? null : waterDays.reduce((total, value) => total + value, 0) / waterDays.length;

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Weekly summary</h2>
      </div>
      <div className="metric-grid">
        <Metric label="Days completed" value={`${completedDays}/${dates.length}`} />
        <Metric label="Supplement consistency" value={`${supplementDays}/${completedDays || 0}`} />
        <Metric label="Breakfast consistency" value={`${breakfastDays}/${completedDays || 0}`} />
        <Metric label="Lunch consistency" value={`${lunchDays}/${completedDays || 0}`} />
        <Metric label="Evening default" value={`${eveningDefaultDays}/${completedDays || 0}`} />
        <Metric label="Snack count" value={String(snackCount)} />
        <Metric
          label="Water avg"
          value={averageWaterMl === null ? 'No estimate' : `${Math.round(averageWaterMl).toLocaleString('en-AU')} ml`}
        />
        <Metric label="Replacement meals" value={String(replacementMeals)} />
        <Metric label="Photos added" value={String(photoCount)} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

const countDefault = (days: FoodLogDay[], slot: string): number =>
  days.filter((day) => day.meals.find((meal) => meal.slot === slot)?.usedDefault).length;
