import { ChemicalHistory } from '@/components/harvest/chemical-history';
import './harvest-detail-panels.css';

type Props = {
  harvestId: number;
  /** Reports the summed cost up, so the money section counts it among the harvest's expenses
   *  whether or not this section has been opened. */
  onTotalChange: (total: number) => void;
};

export function ChemicalSection({ harvestId, onTotalChange }: Props) {
  return (
    <section className="hd-panel">
      <ChemicalHistory harvestId={harvestId} onTotalChange={onTotalChange} />
    </section>
  );
}
