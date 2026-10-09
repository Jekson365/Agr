export function Lari({ value, decimals = false }: { value: number; decimals?: boolean }) {
  return (
    <>
      <span className="wn-lari">₾</span>
      {decimals ? Math.round(value * 100) / 100 : Math.round(value)}
    </>
  );
}
