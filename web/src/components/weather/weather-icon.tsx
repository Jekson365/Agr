import type { ComponentType, SVGProps } from 'react';

import {
  CloudIcon,
  DrizzleIcon,
  FogIcon,
  MoonIcon,
  PartlyCloudyDayIcon,
  PartlyCloudyNightIcon,
  RainIcon,
  SleetIcon,
  SnowIcon,
  SunIcon,
  ThunderIcon,
} from '@/components/icons/weather-icons';
import type { WeatherIconKind } from '@/config/weather';

const GLYPHS: Record<WeatherIconKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  sun: SunIcon,
  moon: MoonIcon,
  partlyDay: PartlyCloudyDayIcon,
  partlyNight: PartlyCloudyNightIcon,
  cloud: CloudIcon,
  fog: FogIcon,
  drizzle: DrizzleIcon,
  rain: RainIcon,
  sleet: SleetIcon,
  snow: SnowIcon,
  thunder: ThunderIcon,
};

type Props = SVGProps<SVGSVGElement> & { kind: WeatherIconKind };

export function WeatherIcon({ kind, ...props }: Props) {
  const Glyph = GLYPHS[kind];
  return <Glyph {...props} />;
}
