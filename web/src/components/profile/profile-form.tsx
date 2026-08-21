import { useEffect, useState } from 'react';

import { CallIcon, ImagesIcon, PersonIcon } from '@/components/icons/misc-icons';
import { ProfileImagePicker } from '@/components/profile/profile-image-picker';
import { ProfileLocationField } from '@/components/profile/profile-location-field';
import { usePickedImage } from '@/components/profile/use-picked-image';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/profile-page.css';

export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const { t } = useLanguage();

  const [nameInput, setNameInput] = useState('');
  const [surnameInput, setSurnameInput] = useState('');
  const [farmNameInput, setFarmNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const avatar = usePickedImage();
  const farmIcon = usePickedImage();

  useEffect(() => {
    setNameInput(user?.name ?? '');
    setSurnameInput(user?.surname ?? '');
    setFarmNameInput(user?.farmName ?? '');
    setPhoneInput(user?.phoneNumber ?? '');
    setCountryInput(user?.country ?? '');
    setCityInput(user?.city ?? '');
    setBirthDate(user?.birthDate?.slice(0, 10) ?? '');
    avatar.reset(user?.imagePath ?? '');
    farmIcon.reset(user?.farmImagePath ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const imagePath = await avatar.commit();
      const farmImagePath = await farmIcon.commit();
      await updateProfile({
        name: nameInput.trim(),
        surname: surnameInput.trim(),
        farmName: farmNameInput.trim(),
        farmImagePath,
        phoneNumber: phoneInput.trim(),
        country: countryInput.trim(),
        city: cityInput.trim(),
        birthDate: birthDate || null,
        imagePath,
      });
    } catch {
      setFormError(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-form">
      <ProfileImagePicker
        label={t('profile.image')}
        previewUrl={avatar.previewUrl}
        placeholder={<PersonIcon width={24} height={24} />}
        onPick={avatar.pick}
      />

      <div className="field-row">
        <div className="field">
          <label>{t('profile.name')}</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder={t('profile.namePlaceholder')} />
        </div>
        <div className="field">
          <label>{t('profile.surname')}</label>
          <input
            value={surnameInput}
            onChange={(e) => setSurnameInput(e.target.value)}
            placeholder={t('profile.surnamePlaceholder')}
          />
        </div>
      </div>

      <div className="field">
        <label>{t('profile.farmName')}</label>
        <input
          value={farmNameInput}
          onChange={(e) => setFarmNameInput(e.target.value)}
          placeholder={t('profile.farmNamePlaceholder')}
        />
      </div>

      <ProfileImagePicker
        label={t('profile.farmIcon')}
        previewUrl={farmIcon.previewUrl}
        placeholder={<ImagesIcon width={24} height={24} />}
        square
        onPick={farmIcon.pick}
      />

      <div className="field">
        <label>{t('profile.phoneNumber')}</label>
        <div className="profile-input-icon">
          <CallIcon width={16} height={16} />
          <input
            type="tel"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder={t('profile.phoneNumberPlaceholder')}
          />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label>{t('profile.country')}</label>
          <input
            value={countryInput}
            onChange={(e) => setCountryInput(e.target.value)}
            placeholder={t('profile.countryPlaceholder')}
          />
        </div>
        <div className="field">
          <label>{t('profile.city')}</label>
          <input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder={t('profile.cityPlaceholder')} />
        </div>
      </div>

      <div className="field">
        <label>{t('profile.birthDate')}</label>
        <DateField value={birthDate} max={todayIsoDate()} onChange={(v) => setBirthDate(v ?? '')} />
      </div>

      <ProfileLocationField />

      {formError && <div className="error-banner">{formError}</div>}

      <button type="button" className="btn profile-save" onClick={handleSaveProfile} disabled={saving}>
        {t('common.save')}
      </button>
    </section>
  );
}
