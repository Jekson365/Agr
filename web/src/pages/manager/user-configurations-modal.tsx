import { useEffect, useState } from 'react';

import { Modal } from '@/components/ui/modal';
import { CONFIGURATION_LABEL_KEY } from '@/config/configuration-labels';
import { useLanguage } from '@/contexts/language-context';
import { getUserConfigurations, setUserConfiguration } from '@/services/admin-service';
import type { AdminUser } from '@/types/admin';
import type { Configuration } from '@/types/configuration';

type Props = {
  /** The account whose areas are being set, or null while the modal is closed. */
  user: AdminUser | null;
  onClose: () => void;
};

export function UserConfigurationsModal({ user, onClose }: Props) {
  const { t } = useLanguage();

  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    setConfigurations([]);
    setError(null);
    setLoading(true);
    getUserConfigurations(user.id)
      .then((loaded) => !cancelled && setConfigurations(loaded))
      .catch(() => !cancelled && setError(t('manager.configurationsLoadError')))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function toggle(name: string, on: boolean) {
    if (!user) return;
    setSaving(name);
    setError(null);
    try {
      const updated = await setUserConfiguration(user.id, name, on ? 1 : 0);
      setConfigurations((prev) => prev.map((config) => (config.name === updated.name ? updated : config)));
    } catch {
      setError(t('manager.configurationsSaveError'));
    } finally {
      setSaving(null);
    }
  }

  const title = user ? `${user.name} ${user.surname}`.trim() || user.email || `#${user.id}` : '';

  return (
    <Modal open={user != null} onClose={onClose}>
      <h2 className="form-title">{t('manager.configurationsTitle')}</h2>
      <p className="modal-body-text">{title}</p>

      {loading ? (
        <div className="state-box">…</div>
      ) : configurations.length === 0 ? (
        <p className="empty-state">{t('manager.configurationsEmpty')}</p>
      ) : (
        <div className="manager-config-list">
          {configurations.map((config) => {
            const on = config.value !== 0;
            return (
              <label key={config.id} className="manager-config-row">
                <input type="checkbox" checked={on} disabled={saving != null} onChange={(e) => toggle(config.name, e.target.checked)} />
                <span className="manager-config-name">{t(CONFIGURATION_LABEL_KEY[config.name] ?? config.name)}</span>
                <span className={on ? 'manager-config-state' : 'manager-config-state muted'}>
                  {t(on ? 'profile.configurationOn' : 'profile.configurationOff')}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {error && <div className="error-banner">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </Modal>
  );
}
