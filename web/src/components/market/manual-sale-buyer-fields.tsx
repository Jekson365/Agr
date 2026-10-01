import { useLanguage } from '@/contexts/language-context';

export type SaleBuyer = {
  name: string;
  surname: string;
  phone: string;
};

type Props = {
  buyer: SaleBuyer;
  onChange: (buyer: SaleBuyer) => void;
};

export function ManualSaleBuyerFields({ buyer, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="field">
        <label>{t('sales.manualBuyerName')}</label>
        <input value={buyer.name} onChange={(e) => onChange({ ...buyer, name: e.target.value })} />
      </div>

      <div className="field">
        <label>{t('sales.manualBuyerSurname')}</label>
        <input value={buyer.surname} onChange={(e) => onChange({ ...buyer, surname: e.target.value })} />
      </div>

      <div className="field">
        <label>{t('sales.manualBuyerPhone')}</label>
        <input type="tel" value={buyer.phone} onChange={(e) => onChange({ ...buyer, phone: e.target.value })} />
      </div>
    </>
  );
}
