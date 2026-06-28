interface DateSelectorProps {
  value: string;
  onChange: (date: string) => void;
  onPrevious: () => void;
  onNext: () => void;
}

export function DateSelector({ value, onChange, onPrevious, onNext }: DateSelectorProps) {
  return (
    <div className="date-navigator" aria-label="Day navigation">
      <button type="button" className="secondary date-step" onClick={onPrevious}>
        Back
      </button>
      <label className="date-field">
        <span className="visually-hidden">Date</span>
        <input
          className="date-input"
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
      <button type="button" className="secondary date-step" onClick={onNext}>
        Next
      </button>
    </div>
  );
}
