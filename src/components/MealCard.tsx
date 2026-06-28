import { useEffect, useMemo, useState } from 'react';
import type { FoodPhoto, MealLog } from '../models/foodLog';
import { getFoodPhotoPath } from '../services/dateService';
import { createObjectUrl } from '../services/photoCompression';
import { PhotoPicker } from './PhotoPicker';

interface MealCardProps {
  date: string;
  meal: MealLog;
  photo?: FoodPhoto;
  onChange: (meal: MealLog) => void;
  onPhotoSelected: (photo: FoodPhoto) => void;
  onError: (message: string) => void;
}

export function MealCard({ date, meal, photo, onChange, onPhotoSelected, onError }: MealCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const photoPath = useMemo(() => getFoodPhotoPath(date, meal.slot), [date, meal.slot]);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = createObjectUrl(photo);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const resetMeal = () => {
    onChange({ ...meal, usedDefault: true, notes: '', photoPath: null });
  };

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>{meal.label}</h2>
        <button type="button" className="text-button" onClick={resetMeal}>
          Clear
        </button>
      </div>

      <label className="default-meal-row">
        <input
          type="checkbox"
          checked={meal.usedDefault}
          aria-label={`${meal.label}: ${meal.templateName}`}
          onChange={(event) =>
            onChange({
              ...meal,
              usedDefault: event.target.checked,
              photoPath: event.target.checked ? null : meal.photoPath,
            })
          }
        />
        <span>{meal.templateName}</span>
      </label>

      {meal.ingredients && (
        <details className="ingredients">
          <summary>Lunch shake ingredients</summary>
          <ul>
            {meal.ingredients.map((ingredient) => (
              <li key={ingredient}>{ingredient}</li>
            ))}
          </ul>
        </details>
      )}

      {!meal.usedDefault && (
        <div className="replacement-fields">
          <PhotoPicker
            label={`Replacement ${meal.label.toLowerCase()} photo`}
            path={photoPath}
            onPhotoSelected={(selectedPhoto) => {
              onPhotoSelected(selectedPhoto);
              onChange({ ...meal, photoPath: selectedPhoto.path });
            }}
            onError={onError}
          />

          {previewUrl && <img className="photo-preview" src={previewUrl} alt={`${meal.label} replacement preview`} />}
          {!previewUrl && meal.photoPath && <p className="muted">Saved photo: {meal.photoPath}</p>}

          <label className="field">
            <span>{meal.label} notes</span>
            <textarea
              value={meal.notes}
              placeholder="What replaced the default?"
              onChange={(event) => onChange({ ...meal, notes: event.target.value })}
            />
          </label>
        </div>
      )}
    </section>
  );
}
