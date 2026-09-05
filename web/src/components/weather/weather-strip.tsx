import { useEffect, useState } from 'react';

import { HumidityIcon, WindIcon } from '@/components/icons/weather-icons';
import { weatherConditionLabel, weatherIconKind } from '@/config/weather';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getCurrentWeather } from '@/services/weather-service';
import type { CurrentWeather } from '@/types/weather';
import { WeatherIcon } from './weather-icon';
import './weather-strip.css';

const REFRESH_MS = 10 * 60 * 1000;

export function WeatherStrip() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [weather, setWeather] = useState<CurrentWeather | null>(null);
  const [failed, setFailed] = useState(false);

  const coords =
    user?.latitude != null && user?.longitude != null
      ? `${user.latitude},${user.longitude}`
      : undefined;

  useEffect(() => {
    let cancelled = false;

    function load() {
      getCurrentWeather(coords)
        .then((data) => {
          if (cancelled) return;
          setWeather(data);
          setFailed(false);
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [coords]);

  if (!weather) {
    return (
      <div className="weather-strip weather-strip-muted">
        {t(failed ? 'weather.unavailable' : 'weather.loading')}
      </div>
    );
  }

  return (
    <div className="weather-strip">
      <WeatherIcon
        kind={weatherIconKind(weather.conditionCode, weather.condition, weather.isDay)}
        className="weather-strip-glyph"
        width={22}
        height={22}
      />
      <span className="weather-strip-temp">{Math.round(weather.tempC)}°C</span>
      <span className="weather-strip-condition">
        {weatherConditionLabel(weather.conditionCode, weather.condition, weather.isDay, t)}
      </span>
      <span className="weather-strip-detail" title={t('weather.humidity')}>
        <HumidityIcon width={14} height={14} />
        {weather.humidity}%
      </span>
      <span className="weather-strip-detail" title={t('weather.wind')}>
        <WindIcon width={14} height={14} />
        {Math.round(weather.windKph)} {t('weather.windUnit')}
      </span>
      <span className="weather-strip-place">{weather.location}</span>
    </div>
  );
}
