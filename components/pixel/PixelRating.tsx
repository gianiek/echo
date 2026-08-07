type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  max?: number;
  label?: string;
  disabled?: boolean;
  /** Same length as `max` — shown instead of the plain number when provided (e.g. mood faces). */
  labels?: string[];
};

export default function PixelRating({ value, onChange, max = 5, label, disabled, labels }: Props) {
  return (
    <div className="pixel-field">
      {label ? <label>{label}</label> : null}
      <div className="chip-row">
        {Array.from({ length: max }, (_, i) => i + 1).map((level) => (
          <button
            key={level}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === level ? null : level)}
            className={`chip ${value === level ? "is-active" : ""}`}
            aria-label={`${level} of ${max}`}
          >
            {labels?.[level - 1] ?? level}
          </button>
        ))}
      </div>
    </div>
  );
}
