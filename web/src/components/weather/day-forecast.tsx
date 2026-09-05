import { weatherConditionLabel, weatherIconKind, weatherTone } from '@/config/weather';
import { useLanguage } from '@/contexts/language-context';
import type { ForecastDay } from '@/types/weather';
import { WeatherIcon } from './weather-icon';
import './day-forecast.css';

type Props = {
  day: ForecastDay;
  compact?: boolean;
};

export function DayForecast({ day, compact = false }: Props) {
  const { t } = useLanguage();
  const kind = weatherIconKind(day.conditionCode, day.condition, true);
  const label = weatherConditionLabel(day.conditionCode, day.condition, true, t);

  const details = [
    label,
    `${Math.round(day.maxTempC)}° / ${Math.round(day.minTempC)}°`,
    `${t('weather.rainChance')} ${day.chanceOfRain}%`,
    `${t('weather.precip')} ${day.totalPrecipMm} ${t('weather.precipUnit')}`,
    `${t('weather.wind')} ${Math.round(day.maxWindKph)} ${t('weather.windUnit')}`,
  ].join(' · ');

  return (
    <span className={`day-forecast tone-${weatherTone(kind)}`} title={details}>
      <WeatherIcon kind={kind} className="day-forecast-glyph" width={24} height={24} />
      {!compact && (
        <span className="day-forecast-temps">
          <span className="day-forecast-max">{Math.round(day.maxTempC)}°</span>
          <span className="day-forecast-min">{Math.round(day.minTempC)}°</span>
        </span>
      )}
    </span>
  );
}
