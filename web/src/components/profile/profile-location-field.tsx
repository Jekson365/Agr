import { useState } from 'react';

import { LocationIcon } from '@/components/icons/misc-icons';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { updateLocation } from '@/services/auth-service';
import '@/pages/profile-page.css';

export function ProfileLocationField() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [locating, setLocating] = useState(false);
  const [locatingError, setLocatingError] = useState<string | null>(null);

  const hasCoords = user?.latitude != null && user?.longitude != null;

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

  return (
    <>
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
    </>
  );
}
