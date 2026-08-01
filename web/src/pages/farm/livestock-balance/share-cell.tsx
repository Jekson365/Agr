type Props = {
  value: number;
  total: number;
};

/** Share of total value, as a bar sitting inline with its percentage. */
export function ShareCell({ value, total }: Props) {
  // With no prices recorded anywhere the total is 0 and every share would be a meaningless
  // empty 0% bar, so say "no data" instead of drawing one.
  if (total <= 0) return <span className="balance-cell num muted">—</span>;

  const share = (value / total) * 100;
  return (
    <span className="balance-cell num share">
      <span className="balance-share-bar">
        <span className="balance-share-fill" style={{ width: `${Math.min(100, share)}%` }} />
      </span>
      {Math.round(share)}%
    </span>
  );
}
