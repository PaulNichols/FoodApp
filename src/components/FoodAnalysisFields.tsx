import type { FoodItemAnalysis } from '../models/foodLog';
import { toBrisbaneTimestamp } from '../services/dateService';

interface FoodAnalysisFieldsProps {
  label: string;
  analysis?: FoodItemAnalysis;
  onChange: (analysis: FoodItemAnalysis | undefined) => void;
}

export function FoodAnalysisFields({ label, analysis, onChange }: FoodAnalysisFieldsProps) {
  const updateAnalysis = (patch: Partial<FoodItemAnalysis>) => {
    onChange({
      itemName: analysis?.itemName ?? '',
      calories: analysis?.calories ?? null,
      confidence: analysis?.confidence ?? null,
      notes: analysis?.notes ?? '',
      ...patch,
      source: 'manual',
      updatedAt: toBrisbaneTimestamp(),
      inputHash: undefined,
    });
  };

  return (
    <fieldset className="analysis-fields">
      <legend>{label}</legend>
      <div className="analysis-grid">
        <label className="field">
          <span>Food</span>
          <input
            value={analysis?.itemName ?? ''}
            placeholder="Meal or snack"
            onChange={(event) => updateAnalysis({ itemName: event.target.value })}
          />
        </label>

        <label className="field">
          <span>Calories</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={analysis?.calories ?? ''}
            placeholder="Estimate"
            onChange={(event) =>
              updateAnalysis({ calories: event.target.value === '' ? null : Number(event.target.value) })
            }
          />
        </label>
      </div>

      <label className="field">
        <span>Analysis notes</span>
        <input
          value={analysis?.notes ?? ''}
          placeholder="Optional detail"
          onChange={(event) => updateAnalysis({ notes: event.target.value })}
        />
      </label>

      {analysis && (
        <div className="analysis-meta">
          <span>{analysis.source === 'openai' ? 'AI estimate' : 'Manual edit'}</span>
          {analysis.confidence && <span>Confidence: {analysis.confidence}</span>}
          <button type="button" className="text-button" onClick={() => onChange(undefined)}>
            Clear analysis
          </button>
        </div>
      )}
    </fieldset>
  );
}
