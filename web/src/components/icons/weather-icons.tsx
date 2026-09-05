import type { SVGProps } from 'react';

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

const CLOUD = 'M4 14.9A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 2.5 8.2';
const CLOUD_SMALL = 'M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z';

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M17.7 17.7l1.4 1.4" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M4.9 19.1l1.4-1.4" />
      <path d="M17.7 6.3l1.4-1.4" />
    </Icon>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" />
    </Icon>
  );
}

export function PartlyCloudyDayIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 2v2" />
      <path d="M4.9 4.9l1.4 1.4" />
      <path d="M20 12h2" />
      <path d="M19.1 4.9l-1.4 1.4" />
      <path d="M15.9 12.7A4 4 0 0 0 10 8.5" />
      <path d={CLOUD_SMALL} />
    </Icon>
  );
}

export function PartlyCloudyNightIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M10.2 8.5A6 6 0 0 1 16 4a1 1 0 0 0 6 6 6 6 0 0 1-3 5.2" />
      <path d={CLOUD_SMALL} />
    </Icon>
  );
}

export function CloudIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9Z" />
    </Icon>
  );
}

export function FogIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d={CLOUD} />
      <path d="M16 17H7" />
      <path d="M17 21H9" />
    </Icon>
  );
}

export function DrizzleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d={CLOUD} />
      <path d="M8 19v1" />
      <path d="M12 21v1" />
      <path d="M16 19v1" />
    </Icon>
  );
}

export function RainIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d={CLOUD} />
      <path d="M8 18v3" />
      <path d="M12 20v3" />
      <path d="M16 18v3" />
    </Icon>
  );
}

export function SleetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d={CLOUD} />
      <path d="M8 18v2" />
      <path d="M16 18v2" />
      <path d="M12 20h.01" />
      <path d="M8 23h.01" />
      <path d="M16 23h.01" />
    </Icon>
  );
}

export function SnowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d={CLOUD} />
      <path d="M8 18h.01" />
      <path d="M8 22h.01" />
      <path d="M12 20h.01" />
      <path d="M16 18h.01" />
      <path d="M16 22h.01" />
    </Icon>
  );
}

export function ThunderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M6 16.3A7 7 0 1 1 15.7 8h1.8a4.5 4.5 0 0 1 .5 9" />
      <path d="M13 12l-3 5h4l-3 5" />
    </Icon>
  );
}

export function HumidityIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z" />
    </Icon>
  );
}

export function WindIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12.8 19.6A2 2 0 1 0 14 16H2" />
      <path d="M17.5 8a2.5 2.5 0 1 1 2 4H2" />
      <path d="M9.8 4.4A2 2 0 1 1 11 8H2" />
    </Icon>
  );
}
