import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';

type Props = {
  seller: string;
  onSeller: (seller: string) => void;
  date: string | null;
  onDate: (date: string | null) => void;
  note: string;
  onNote: (note: string) => void;
};

export function PurchaseDocumentFields({ seller, onSeller, date, onDate, note, onNote }: Props) {
  const { t } = useLanguage();

  return (
    <div className="modal-form-grid">
      <div className="field">
        <label>{t('purchase.seller')}</label>
        <input value={seller} onChange={(e) => onSeller(e.target.value)} placeholder={t('purchase.sellerPlaceholder')} />
      </div>

      <div className="field">
        <label>{t('purchase.date')}</label>
        <DateField value={date} onChange={onDate} clearable={false} />
      </div>

      <div className="field field-full">
        <label>{t('purchase.note')}</label>
        <textarea value={note} onChange={(e) => onNote(e.target.value)} placeholder={t('purchase.notePlaceholder')} />
      </div>
    </div>
  );
}
