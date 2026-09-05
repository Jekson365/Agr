import { ImagesIcon } from '@/components/icons/misc-icons';
import { ProfileImagePicker } from '@/components/profile/profile-image-picker';
import { LocationPickerMap } from '@/components/ui/location-picker-map';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { ProfileDraft } from '../onboarding-draft';

type Props = {
  value: ProfileDraft;
  onChange: (next: ProfileDraft) => void;
};

export function FarmProfileStep({ value, onChange }: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const existingIcon = user?.farmImagePath ?? '';
  const previewUrl = value.iconPreview ?? (existingIcon ? resolveAssetUrl(existingIcon) : null);

  function pickIcon(file: File) {
    onChange({ ...value, iconFile: file, iconPreview: URL.createObjectURL(file) });
  }

  return (
    <div className="onboarding-step">
      <div className="onboarding-fields">
        <div className="field">
          <label>{t('profile.farmName')}</label>
          <input
            value={value.farmName}
            onChange={(e) => onChange({ ...value, farmName: e.target.value })}
            placeholder={t('profile.farmNamePlaceholder')}
          />
        </div>

        <ProfileImagePicker
          label={t('profile.farmIcon')}
          previewUrl={previewUrl}
          placeholder={<ImagesIcon width={24} height={24} />}
          square
          onPick={pickIcon}
        />

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
