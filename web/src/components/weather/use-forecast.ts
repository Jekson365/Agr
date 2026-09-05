import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { getWeatherForecast } from '@/services/weather-service';
import type { ForecastDay } from '@/types/weather';

const REFRESH_MS = 30 * 60 * 1000;

export type Forecast = Map<string, ForecastDay>;

export function useForecast(): Forecast {
  const { user } = useAuth();
  const [byDate, setByDate] = useState<Forecast>(() => new Map());

  const coords =
    user?.latitude != null && user?.longitude != null
      ? `${user.latitude},${user.longitude}`
      : undefined;

  useEffect(() => {
    let cancelled = false;

    function load() {
      getWeatherForecast(coords)
        .then((data) => {
          if (cancelled) return;
          setByDate(new Map(data.days.map((day) => [day.date, day])));
        })
        .catch(() => {
          if (!cancelled) setByDate(new Map());
        });
    }

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [coords]);

  return byDate;
}
