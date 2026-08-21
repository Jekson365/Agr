import type { ReactNode } from 'react';

import { useLanguage } from '@/contexts/language-context';
import '@/pages/profile-page.css';

type Props = {
  label: string;
  previewUrl: string | null;
  placeholder: ReactNode;
  square?: boolean;
  onPick: (file: File) => void;
};

export function ProfileImagePicker({ label, previewUrl, placeholder, square, onPick }: Props) {
  const { t } = useLanguage();

  return (
    <div className="field">
      <label>{label}</label>
      <div className="profile-image-picker">
        <div className={square ? 'profile-image-preview square' : 'profile-image-preview'}>
          {previewUrl ? <img src={previewUrl} alt="" /> : placeholder}
        </div>
        <label className="btn btn-secondary profile-image-button">
          {previewUrl ? t('farm.changeImage') : t('farm.chooseImage')}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPick(file);
              e.target.value = '';
            }}
          />
        </label>
      </div>
    </div>
  );
}
