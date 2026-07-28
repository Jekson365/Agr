import './image-field.css';

type Props = {
  label: string;
  chooseLabel: string;
  changeLabel: string;
  previewUrl: string | null;
  onPick: (file: File) => void;
};

export function ImageField({ label, chooseLabel, changeLabel, previewUrl, onPick }: Props) {
  return (
    <div className="field">
      <label>{label}</label>
      <label className="image-field">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="image-field-preview" />
        ) : (
          <span className="image-field-placeholder" aria-hidden>
            🖼
          </span>
        )}
        <span className="image-field-label">{previewUrl ? changeLabel : chooseLabel}</span>
        <input
          type="file"
          accept="image/*"
          className="image-field-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
          }}
        />
      </label>
    </div>
  );
}
