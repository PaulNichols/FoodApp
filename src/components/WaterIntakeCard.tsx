import type { WaterIntakeLog } from '../models/foodLog';
import { getWaterIntakeTotalMl } from '../models/foodLog';

interface WaterIntakeCardProps {
  waterIntake: WaterIntakeLog;
  onChange: (waterIntake: WaterIntakeLog) => void;
}

export function WaterIntakeCard({ waterIntake, onChange }: WaterIntakeCardProps) {
  const updateEntry = (id: string, patch: Partial<WaterIntakeLog['entries'][number]>) => {
    onChange({
      entries: waterIntake.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    });
  };

  const addDrink = () => {
    const drinkNumbers = waterIntake.entries
      .map((entry) => entry.id.match(/^drink-(\d+)$/)?.[1])
      .map((value) => (value ? Number(value) : 0));
    const nextDrinkNumber = Math.max(0, ...drinkNumbers) + 1;
    const id = `drink-${nextDrinkNumber}`;

    onChange({
      entries: [...waterIntake.entries, { id, label: 'Extra drink', amountMl: '', consumed: true }],
    });
  };

  const removeEntry = (id: string) => {
    onChange({ entries: waterIntake.entries.filter((entry) => entry.id !== id) });
  };

  const totalMl = getWaterIntakeTotalMl(waterIntake);

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Water intake</h2>
        <button type="button" onClick={addDrink}>
          Add drink
        </button>
      </div>

      <div className="water-list">
        {waterIntake.entries.map((entry) => (
          <div className="water-row" key={entry.id}>
            <label className="water-consumed">
              <input
                type="checkbox"
                checked={entry.consumed}
                onChange={(event) => updateEntry(entry.id, { consumed: event.target.checked })}
              />
              <span>{entry.label}</span>
            </label>
            <label className="field water-amount">
              <span>{entry.label} ml</span>
              <input
                value={entry.amountMl}
                inputMode="decimal"
                placeholder="ml"
                onChange={(event) => updateEntry(entry.id, { amountMl: event.target.value })}
              />
            </label>
            {entry.id.startsWith('drink-') && (
              <button type="button" className="text-button danger" onClick={() => removeEntry(entry.id)}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="status">Water total: {totalMl === null ? 'No estimate' : `${Math.round(totalMl).toLocaleString('en-AU')} ml`}</p>
    </section>
  );
}
