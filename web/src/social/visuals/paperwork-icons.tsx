const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CrossIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" {...STROKE}>
      <circle cx="12" cy="12" r="10" />
      <path d="m8.5 8.5 7 7M15.5 8.5l-7 7" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true" {...STROKE}>
      <circle cx="12" cy="12" r="10" />
      <path d="m7.5 12.5 3 3 6-6.5" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...STROKE}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...STROKE}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" {...STROKE} strokeWidth={2.8}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}
