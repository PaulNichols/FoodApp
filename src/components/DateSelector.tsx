interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
}

export function DateSelector({ value, onChange, onPrevious, onNext, disabled = false }: DateSelectorProps) {
  return (
    <div className="date-navigator" aria-label="Day navigation">
      <button type="button" className="secondary date-step" onClick={onPrevious} disabled={disabled}>
        Back
      </button>
      <label className="date-field">
        <span className="visually-hidden">Date</span>
        <input
          className="date-input"
          type="date"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button type="button" className="secondary date-step" onClick={onNext} disabled={disabled}>
        Next
      </button>
    </div>
  );
}
