import { useEffect, useState } from 'react';
import type { FoodPhoto, SnackLog } from '../models/foodLog';
import { getFoodPhotoPath } from '../services/dateService';
import { createObjectUrl } from '../services/photoCompression';
import { FoodAnalysisFields } from './FoodAnalysisFields';
import { PhotoPicker } from './PhotoPicker';

interface SnackListProps {
  date: string;
  snacks: SnackLog[];
  photos: FoodPhoto[];
  onChange: (snacks: SnackLog[]) => void;
  onPhotoSelected: (photo: FoodPhoto) => void;
  onError: (message: string) => void;
}

export function SnackList({ date, snacks, photos, onChange, onPhotoSelected, onError }: SnackListProps) {
  const addSnack = () => {
    const id = `snack-${snacks.length + 1}`;
    onChange([...snacks, { id, notes: '', photoPath: null, analysis: undefined }]);
  };

  return (
    <section className="panel">
      <div className="panel-title">
        <h2>Snacks / extras</h2>
        <button type="button" onClick={addSnack}>
          Add snack
        </button>
      </div>

      {snacks.length === 0 && <p className="empty-state">No snacks added for this day.</p>}

      <div className="snack-list">
        {snacks.map((snack, index) => (
          <SnackItem
            key={snack.id}
            date={date}
            snack={snack}
            index={index}
            photo={photos.find((photo) => photo.path === snack.photoPath)}
            onChange={(nextSnack) =>
              onChange(snacks.map((item) => (item.id === snack.id ? nextSnack : item)))
            }
            onRemove={() => onChange(snacks.filter((item) => item.id !== snack.id))}
            onPhotoSelected={onPhotoSelected}
            onError={onError}
          />
        ))}
      </div>
    </section>
  );
}

interface SnackItemProps {
  date: string;
  snack: SnackLog;
  index: number;
  photo?: FoodPhoto;
  onChange: (snack: SnackLog) => void;
  onRemove: () => void;
  onPhotoSelected: (photo: FoodPhoto) => void;
  onError: (message: string) => void;
}

function SnackItem({ date, snack, index, photo, onChange, onRemove, onPhotoSelected, onError }: SnackItemProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const path = getFoodPhotoPath(date, snack.id);

  useEffect(() => {
    if (!photo) {
      setPreviewUrl(null);
      return undefined;
    }

    const url = createObjectUrl(photo);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return (
    <article className="snack-item">
      <div className="panel-title compact">
        <h3>Snack {index + 1}</h3>
        <button type="button" className="text-button danger" onClick={onRemove}>
          Remove
        </button>
      </div>

      <label className="field">
        <span>Snack notes</span>
        <input
          value={snack.notes}
          placeholder="Greek yoghurt, fruit, social meal..."
          onChange={(event) => onChange({ ...snack, notes: event.target.value })}
        />
      </label>

      <PhotoPicker
        label="Snack photo"
        path={path}
        onPhotoSelected={(selectedPhoto) => {
          onPhotoSelected(selectedPhoto);
          onChange({ ...snack, photoPath: selectedPhoto.path });
        }}
        onError={onError}
      />

      {previewUrl && <img className="photo-preview" src={previewUrl} alt={`Snack ${index + 1} preview`} />}
      {!previewUrl && snack.photoPath && <p className="muted">Saved photo: {snack.photoPath}</p>}

      <FoodAnalysisFields
        label={`Snack ${index + 1} analysis`}
        analysis={snack.analysis}
        onChange={(analysis) => onChange({ ...snack, analysis })}
      />
    </article>
  );
}
