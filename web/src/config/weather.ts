export type WeatherIconKind =
  | 'sun'
  | 'moon'
  | 'partlyDay'
  | 'partlyNight'
  | 'cloud'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'sleet'
  | 'snow'
  | 'thunder';

export type WeatherTone = 'clear' | 'cloud' | 'rain' | 'snow' | 'storm';

const CLOUD_CODES = [1006, 1009];
const FOG_CODES = [1030, 1135, 1147];
const DRIZZLE_CODES = [1063, 1150, 1153, 1168, 1171];
const SLEET_CODES = [1069, 1072, 1204, 1207, 1237, 1249, 1252, 1261, 1264];
const SNOW_CODES = [1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258];
const THUNDER_CODES = [1087, 1273, 1276, 1279, 1282];

const TONES: Record<WeatherIconKind, WeatherTone> = {
  sun: 'clear',
  moon: 'clear',
  partlyDay: 'cloud',
  partlyNight: 'cloud',
  cloud: 'cloud',
  fog: 'cloud',
  drizzle: 'rain',
  rain: 'rain',
  sleet: 'snow',
  snow: 'snow',
  thunder: 'storm',
};

function kindFromText(condition: string, isDay: boolean): WeatherIconKind {
  const text = condition.toLowerCase();
  if (text.includes('thunder')) return 'thunder';
  if (text.includes('sleet') || text.includes('ice')) return 'sleet';
  if (text.includes('snow') || text.includes('blizzard')) return 'snow';
  if (text.includes('drizzle')) return 'drizzle';
  if (text.includes('rain') || text.includes('shower')) return 'rain';
  if (text.includes('mist') || text.includes('fog')) return 'fog';
  if (text.includes('cloud') || text.includes('overcast')) return 'cloud';
  return isDay ? 'sun' : 'moon';
}

export function weatherIconKind(code: number, condition: string, isDay: boolean): WeatherIconKind {
  if (code === 1000) return isDay ? 'sun' : 'moon';
  if (code === 1003) return isDay ? 'partlyDay' : 'partlyNight';
  if (CLOUD_CODES.includes(code)) return 'cloud';
  if (FOG_CODES.includes(code)) return 'fog';
  if (THUNDER_CODES.includes(code)) return 'thunder';
  if (SNOW_CODES.includes(code)) return 'snow';
  if (SLEET_CODES.includes(code)) return 'sleet';
  if (DRIZZLE_CODES.includes(code)) return 'drizzle';
  if (code >= 1180 && code <= 1246) return 'rain';
  return kindFromText(condition, isDay);
}

export function weatherTone(kind: WeatherIconKind): WeatherTone {
  return TONES[kind];
}

export function weatherConditionLabel(
  code: number,
  condition: string,
  isDay: boolean,
  t: (key: string) => string
): string {
  const key = `weather.conditions.${code === 1000 && !isDay ? 'clearNight' : code}`;
  const label = t(key);
  return label === key ? condition : label;
}
