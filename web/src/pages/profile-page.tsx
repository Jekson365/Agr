import { useEffect, useState } from 'react';

import '@/components/farm/farm-crud.css';
import { CallIcon, LocationIcon, PersonIcon } from '@/components/icons/misc-icons';
import { todayIsoDate } from '@/components/ui/date-utils';
import { formatBytes } from '@/components/ui/format-bytes';
import { CONFIGURATION_LABEL_KEY } from '@/config/configuration-labels';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { updateLocation, uploadProfileImage } from '@/services/auth-service';
import type { StoragePlan } from '@/types/auth';
import './profile-page.css';

const STORAGE_PLAN_LABEL_KEY: Record<StoragePlan, string> = {
  Free: 'profile.planFree',
  Medium: 'profile.planMedium',
  Premium: 'profile.planPremium',
};

function countLabel(max: number | null, t: (key: string) => string): string {
  return max == null ? t('profile.limitUnlimited') : String(max);
}

export function ProfilePage() {
  const { user, updateProfile, refreshUser } = useAuth();
  const { configurations, setValue } = useConfiguration();
  const { t } = useLanguage();

  /** The setting currently being written, so its checkbox can't be clicked twice mid-flight. */
  const [savingConfig, setSavingConfig] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  async function toggleConfiguration(name: string, on: boolean) {
    setSavingConfig(name);
    setConfigError(null);
    try {
      await setValue(name, on ? 1 : 0);
    } catch {
      // The switch is driven by the shared copy, which only moves once the server agrees — so a
      // failure leaves the checkbox where it was and just needs saying.
      setConfigError(t('profile.configurationSaveError'));
    } finally {
      setSavingConfig(null);
    }
  }

  // Storage usage changes whenever an image is uploaded anywhere in the app (stock photos,
  // equipment, livestock, listings...), so re-fetch the current user on mount rather than
  // relying on the possibly-stale cached session user.
  useEffect(() => {
    refreshUser().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [nameInput, setNameInput] = useState('');
  const [surnameInput, setSurnameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [countryInput, setCountryInput] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [pickedImage, setPickedImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [existingImagePath, setExistingImagePath] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [locatingError, setLocatingError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setNameInput(user?.name ?? '');
    setSurnameInput(user?.surname ?? '');
    setPhoneInput(user?.phoneNumber ?? '');
    setCountryInput(user?.country ?? '');
    setCityInput(user?.city ?? '');
    setBirthDate(user?.birthDate?.slice(0, 10) ?? '');
    setPickedImage(null);
    setExistingImagePath(user?.imagePath ?? '');
    // Only re-sync form fields when the logged-in user actually changes, not on every
    // background refreshUser() above — otherwise an in-progress edit gets silently
    // overwritten each time the profile data comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fullName = [user?.name, user?.surname].filter(Boolean).join(' ') || user?.name || '';
  const initials = fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const roleLabel = user?.role === 'Owner' ? t('profile.roleOwner') : t('profile.roleMember');
  const previewUrl = pickedImage?.previewUrl ?? (existingImagePath ? resolveAssetUrl(existingImagePath) : null);
  const hasCoords = user?.latitude != null && user?.longitude != null;

  function pickImage(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setPickedImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleSaveProfile() {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const imagePath = pickedImage ? await uploadProfileImage(pickedImage.file) : existingImagePath;
      await updateProfile({
        name: nameInput.trim(),
        surname: surnameInput.trim(),
        phoneNumber: phoneInput.trim(),
        country: countryInput.trim(),
        city: cityInput.trim(),
        birthDate: birthDate || null,
        imagePath,
      });
      setPickedImage(null);
      setExistingImagePath(imagePath);
    } catch {
      setFormError(t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  }

  // The mobile app picks the location on a map screen; on the web the browser's own
  // geolocation prompt is the equivalent affordance, so there is no map dependency here.
  function handleUseCurrentLocation() {
    if (locating) return;
    setLocatingError(null);

    if (!navigator.geolocation) {
      setLocatingError(t('profile.locationError'));
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await updateLocation(position.coords.latitude, position.coords.longitude);
          await refreshUser();
        } catch {
          setLocatingError(t('profile.locationSaveError'));
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        setLocatingError(
          error.code === error.PERMISSION_DENIED ? t('profile.locationPermissionDenied') : t('profile.locationError')
        );
      }
    );
  }

  const limitRows = user
    ? [
        { label: t('profile.limitLand'), value: countLabel(user.maxLand, t), muted: false },
        { label: t('profile.limitLivestock'), value: countLabel(user.maxLivestockKinds, t), muted: false },
        { label: t('profile.limitStock'), value: countLabel(user.maxStockKinds, t), muted: false },
        { label: t('profile.limitFruit'), value: countLabel(user.maxFruitKinds, t), muted: false },
        {
          label: t('profile.limitBalance'),
          value: t(user.balanceAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
          muted: !user.balanceAllowed,
        },
        {
          label: t('profile.limitEquipment'),
          value: t(user.equipmentAllowed ? 'profile.limitIncluded' : 'profile.limitNotIncluded'),
          muted: !user.equipmentAllowed,
        },
      ]
    : [];

  return (
    <div className="page-fill">
      <div className="page-fill-header">
        <div className="page-header">
          <h1 className="page-title">{t('profile.title')}</h1>
        </div>
      </div>

      <div className="page-fill-scroll">
        <div className="profile-layout">
          <aside className="profile-summary-card">
            <div className="profile-avatar">
              {user?.imagePath ? (
                <img src={resolveAssetUrl(user.imagePath)} alt="" />
              ) : initials ? (
                <span className="profile-avatar-initials">{initials}</span>
              ) : (
                <PersonIcon width={28} height={28} />
              )}
            </div>
            <div className="profile-name">{fullName || user?.name}</div>
            <div className="profile-badge">{roleLabel}</div>

            {user && (
              <div className="profile-storage">
                <div className="profile-storage-header">
                  <span className="profile-badge">{t(STORAGE_PLAN_LABEL_KEY[user.plan] ?? STORAGE_PLAN_LABEL_KEY.Free)}</span>
                  <span className="profile-storage-text">
                    {user.storageLimitBytes == null
                      ? t('profile.storageUsedUnlimited', { used: formatBytes(user.storageUsedBytes) })
                      : t('profile.storageUsed', {
                          used: formatBytes(user.storageUsedBytes),
                          limit: formatBytes(user.storageLimitBytes),
                        })}
                  </span>
                </div>

                {user.storageLimitBytes != null && (
                  <div className="profile-storage-track">
                    <div
                      className="profile-storage-fill"
                      style={{ width: `${Math.min(100, (user.storageUsedBytes / user.storageLimitBytes) * 100)}%` }}
                    />
                  </div>
                )}

                <div className="profile-limits-title">{t('profile.planLimitsTitle')}</div>
                {limitRows.map((row) => (
                  <div key={row.label} className="profile-limit-row">
                    <span className="profile-limit-label">{row.label}</span>
                    <span className={row.muted ? 'profile-limit-value muted' : 'profile-limit-value'}>{row.value}</span>
                  </div>
                ))}

                {/* Every configuration the server sends, whatever it is — a new setting shows up
                    here without this page knowing its name. */}
                {configurations.length > 0 && (
                  <>
                    <div className="profile-limits-title">{t('profile.configurationsTitle')}</div>
                    {configurations.map((config) => {
                      const on = config.value !== 0;
                      return (
                        <label key={config.id} className="profile-config-row">
                          <input
                            type="checkbox"
                            checked={on}
                            disabled={savingConfig != null}
                            onChange={(e) => toggleConfiguration(config.name, e.target.checked)}
                          />
                          <span className="profile-limit-label">
                            {t(CONFIGURATION_LABEL_KEY[config.name] ?? config.name)}
                          </span>
                          <span className={on ? 'profile-limit-value' : 'profile-limit-value muted'}>
                            {t(on ? 'profile.configurationOn' : 'profile.configurationOff')}
                          </span>
                        </label>
                      );
                    })}
                    {configError && <div className="profile-config-error">{configError}</div>}
                  </>
                )}
              </div>
            )}
          </aside>

          <section className="profile-form">
            <div className="field">
              <label>{t('profile.image')}</label>
              <div className="profile-image-picker">
                <div className="profile-image-preview">
                  {previewUrl ? <img src={previewUrl} alt="" /> : <PersonIcon width={24} height={24} />}
                </div>
                <label className="btn btn-secondary profile-image-button">
                  {previewUrl ? t('farm.changeImage') : t('farm.chooseImage')}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      pickImage(e.target.files);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

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

            <div className="field">
              <label>{t('profile.location')}</label>
              <div className="profile-location-row">
                <LocationIcon width={18} height={18} />
                <span className="profile-location-text">
                  {hasCoords ? `${user!.latitude!.toFixed(5)}, ${user!.longitude!.toFixed(5)}` : t('profile.locationNotSet')}
                </span>
                <button type="button" className="profile-location-action" onClick={handleUseCurrentLocation} disabled={locating}>
                  {hasCoords ? t('profile.changeLocation') : t('profile.useCurrentLocation')}
                </button>
              </div>
            </div>

            {locatingError && <div className="error-banner">{locatingError}</div>}
            {formError && <div className="error-banner">{formError}</div>}

            <button type="button" className="btn profile-save" onClick={handleSaveProfile} disabled={saving}>
              {t('common.save')}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
