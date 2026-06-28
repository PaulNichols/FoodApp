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
      nutrition: analysis?.nutrition,
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

      <div className="macro-grid">
        <MacroInput
          label="Protein"
          value={analysis?.nutrition?.proteinGrams}
          onChange={(value) => updateNutrition('proteinGrams', value)}
        />
        <MacroInput
          label="Carbs"
          value={analysis?.nutrition?.carbohydrateGrams}
          onChange={(value) => updateNutrition('carbohydrateGrams', value)}
        />
        <MacroInput
          label="Fat"
          value={analysis?.nutrition?.fatGrams}
          onChange={(value) => updateNutrition('fatGrams', value)}
        />
        <MacroInput
          label="Sugar"
          value={analysis?.nutrition?.sugarGrams}
          onChange={(value) => updateNutrition('sugarGrams', value)}
        />
        <MacroInput
          label="Fibre"
          value={analysis?.nutrition?.fibreGrams}
          onChange={(value) => updateNutrition('fibreGrams', value)}
        />
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
          <span>{getAnalysisSourceLabel(analysis.source)}</span>
          {analysis.confidence && <span>Confidence: {analysis.confidence}</span>}
          <button type="button" className="text-button" onClick={() => onChange(undefined)}>
            Clear analysis
          </button>
        </div>
      )}
    </fieldset>
  );

  function updateNutrition(field: keyof NonNullable<FoodItemAnalysis['nutrition']>, value: number | null) {
    updateAnalysis({
      nutrition: {
        proteinGrams: analysis?.nutrition?.proteinGrams ?? null,
        carbohydrateGrams: analysis?.nutrition?.carbohydrateGrams ?? null,
        fatGrams: analysis?.nutrition?.fatGrams ?? null,
        sugarGrams: analysis?.nutrition?.sugarGrams ?? null,
        fibreGrams: analysis?.nutrition?.fibreGrams ?? null,
        [field]: value,
      },
    });
  }
}

interface MacroInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (value: number | null) => void;
}

function MacroInput({ label, value, onChange }: MacroInputProps) {
  return (
    <label className="field">
      <span>{label} g</span>
      <input
        type="number"
        min="0"
        step="0.1"
        inputMode="decimal"
        value={value ?? ''}
        placeholder="g"
        onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))}
      />
    </label>
  );
}

const getAnalysisSourceLabel = (source: FoodItemAnalysis['source']): string => {
  if (source === 'openai') {
    return 'AI estimate';
  }

  if (source === 'codex') {
    return 'Codex estimate';
  }

  return 'Manual edit';
};
