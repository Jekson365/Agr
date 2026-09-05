export type CurrentWeather = {
  location: string;
  tempC: number;
  tempF: number;
  condition: string;
  iconUrl: string;
  conditionCode: number;
  humidity: number;
  windKph: number;
  isDay: boolean;
  localTime: string;
};

export type ForecastDay = {
  date: string;
  maxTempC: number;
  minTempC: number;
  avgTempC: number;
  condition: string;
  iconUrl: string;
  conditionCode: number;
  chanceOfRain: number;
  chanceOfSnow: number;
  totalPrecipMm: number;
  maxWindKph: number;
  avgHumidity: number;
};

export type WeatherForecast = {
  location: string;
  days: ForecastDay[];
};
