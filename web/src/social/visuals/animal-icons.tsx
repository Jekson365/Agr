const LINE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function EarTag({ prefix, number }: { prefix: string; number: string }) {
  return (
    <svg className="social-sticker passport-tag" viewBox="0 0 200 250" aria-hidden="true">
      <path
        className="passport-tag-body"
        d="M100 10c18 0 30 12 30 28v14h30c16 0 28 12 28 28v116c0 26-21 46-47 46H59c-26 0-47-20-47-46V80c0-16 12-28 28-28h30V38c0-16 12-28 30-28Z"
      />
      <circle className="passport-tag-stud" cx="100" cy="38" r="13" />
      <circle className="passport-tag-hole" cx="100" cy="38" r="6" />
      <text className="passport-tag-prefix" x="100" y="122" textAnchor="middle">
        {prefix}
      </text>
      <text className="passport-tag-number" x="100" y="190" textAnchor="middle">
        {number}
      </text>
    </svg>
  );
}

export function FemaleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...LINE}>
      <circle cx="12" cy="9" r="5.5" />
      <path d="M12 14.5V22M8.5 18.5h7" />
    </svg>
  );
}

export function MaleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" {...LINE}>
      <circle cx="10" cy="14" r="5.5" />
      <path d="M14 10 20.5 3.5M15 3.5h5.5V9" />
    </svg>
  );
}

export function SyringeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...LINE}>
      <path d="m18 2 4 4M20 4l-4 4M16 8 7 17l-3-3 9-9M11 5l8 8M6.5 14.5 3 21M9 11l2 2M12 8l2 2" />
    </svg>
  );
}

export function StethoscopeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" {...LINE}>
      <path d="M5 3v6a5 5 0 0 0 10 0V3M5 3H3.5M15 3h1.5M10 14v2a5 5 0 0 0 10 0v-2" />
      <circle cx="20" cy="11.5" r="2.5" />
    </svg>
  );
}
