import { LocationPickerMap } from '@/components/ui/location-picker-map';
import { useLanguage } from '@/contexts/language-context';
import type { ProfileDraft } from '../onboarding-draft';

type Props = {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
};

export function FarmProfileStep({ value, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="onboarding-step">
      <div className="onboarding-fields">
        <div className="field onboarding-field-wide">
          <label>{t('profile.farmName')}</label>
          <input
            value={value.farmName}
            onChange={(e) => onChange({ ...value, farmName: e.target.value })}
            placeholder={t('profile.farmNamePlaceholder')}
          />
        </div>

        <div className="field onboarding-field-wide">
          <label>{t('profile.location')}</label>
          <div className="onboarding-map">
            <LocationPickerMap value={value.point} onChange={(point) => onChange({ ...value, point })} />
          </div>
          <span className="limit-hint">
            {value.point
              ? `${value.point.lat.toFixed(5)}, ${value.point.lng.toFixed(5)}`
              : t('profile.locationHint')}
          </span>
        </div>
      </div>
    </div>
  );
}
