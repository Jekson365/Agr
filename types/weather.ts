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