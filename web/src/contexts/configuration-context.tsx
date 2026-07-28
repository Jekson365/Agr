import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { getConfigurations, setConfiguration } from '@/services/configuration-service';
import type { Configuration } from '@/types/configuration';

type ConfigurationContextValue = {
  configurations: Configuration[];
  loading: boolean;
  /**
   * Whether the first fetch has settled. Anything that *denies* access on a setting being off has
   * to wait for this — before it, every name reads as off simply because nothing has arrived, and
   * a route guard would turn that into a redirect away from a page the tenant is entitled to.
   */
  loaded: boolean;
  /**
   * True when the settings could not be fetched. Every name then reads as off, which is fine for
   * deciding what to *offer* but not for deciding what to *deny* — see ConfigRoute, which lets
   * everything through rather than locking a tenant out of the app over a failed request.
   */
  loadError: boolean;
  /** Whether a setting is switched on. Unknown or unset names read as off. */
  isOn: (name: string) => boolean;
  /** Switches a setting and keeps the shared copy in step, so the sidebar and guards react at once. */
  setValue: (name: string, value: number) => Promise<void>;
};

const ConfigurationContext = createContext<ConfigurationContextValue | undefined>(undefined);

/**
 * The tenant's settings, fetched once and shared. Both the sidebar (which hides areas a setting
 * turns off) and the profile (which lists them all) need them, and neither should pay for its own
 * request. Loaded per signed-in user, since the settings live in that user's own database.
 */
export function ConfigurationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!user) {
      setConfigurations([]);
      setLoaded(false);
      setLoadError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    getConfigurations()
      .then((list) => {
        if (cancelled) return;
        setConfigurations(list);
        setLoadError(false);
      })
      .catch(() => {
        // A settings request that fails leaves every switch off, so gated areas stop being
        // offered. What it must not do is deny access to them — that is what loadError is for.
        if (cancelled) return;
        setConfigurations([]);
        setLoadError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  /* Writes through to the server first, then updates the shared copy, so a rejected change never
     leaves the sidebar showing an area the server still has switched off. */
  const setValue = useCallback(async (name: string, value: number) => {
    const updated = await setConfiguration(name, value);
    setConfigurations((current) =>
      current.map((config) => (config.name === updated.name ? updated : config))
    );
  }, []);

  const isOn = useCallback(
    (name: string) => configurations.some((config) => config.name === name && config.value !== 0),
    [configurations]
  );

  const value = useMemo<ConfigurationContextValue>(
    () => ({ configurations, loading, loaded, loadError, isOn, setValue }),
    [configurations, loading, loaded, loadError, isOn, setValue]
  );

  return <ConfigurationContext.Provider value={value}>{children}</ConfigurationContext.Provider>;
}

export function useConfiguration() {
  const context = useContext(ConfigurationContext);
  if (!context) {
    throw new Error('useConfiguration must be used within a ConfigurationProvider');
  }
  return context;
}
