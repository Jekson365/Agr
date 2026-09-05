import type { ReactElement, SVGProps } from 'react';

import type { HarvestActivity } from '@/config/harvest-activity';

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

export function IrrigationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3c2.7 3.4 4 5.7 4 7.5a4 4 0 0 1-8 0C8 8.7 9.3 6.4 12 3Z" />
      <path d="M5 20h14" />
      <path d="M8 17v.01" />
      <path d="M16 17v.01" />
    </Icon>
  );
}

export function FertilizationIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 21v-7" />
      <path d="M12 14c0-2.4 1.9-4.3 4.3-4.3C16.3 12.1 14.4 14 12 14Z" />
      <path d="M12 17c0-2.4-1.9-4.3-4.3-4.3C7.7 15.1 9.6 17 12 17Z" />
      <path d="M8 5v.01" />
      <path d="M12 3v.01" />
      <path d="M16 5v.01" />
    </Icon>
  );
}

export function CropProtectionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5.5c0 4.2 2.9 7.4 7 8.5 4.1-1.1 7-4.3 7-8.5V6l-7-3Z" />
      <path d="M9.5 13.6c0-2.6 2.1-4.7 4.7-4.7 0 2.6-2.1 4.7-4.7 4.7Z" />
    </Icon>
  );
}

export function InspectionIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m19.5 19.5-4.4-4.4" />
      <path d="M8 12.8c0-2.6 2-4.6 4.6-4.6 0 2.6-2 4.6-4.6 4.6Z" />
    </Icon>
  );
}

const ACTIVITY_ICON: Record<HarvestActivity, (props: SVGProps<SVGSVGElement>) => ReactElement> = {
  Irrigation: IrrigationIcon,
  Fertilization: FertilizationIcon,
  CropProtection: CropProtectionIcon,
  Inspection: InspectionIcon,
};

export function ActivityIcon({ activity, ...props }: { activity: string } & SVGProps<SVGSVGElement>) {
  const Drawn = ACTIVITY_ICON[activity as HarvestActivity];
  return Drawn ? <Drawn {...props} /> : null;
}
