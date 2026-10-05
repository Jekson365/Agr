import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';

export type WineBatchDraft = {
  name: string;
  vintage: string;
  startDate: string;
  notes: string;
};

type Props = {
  draft: WineBatchDraft;
  onChange: (next: WineBatchDraft) => void;
};

export function WineBatchFields({ draft, onChange }: Props) {
  const { t } = useLanguage();

  function set<K extends keyof WineBatchDraft>(key: K, value: WineBatchDraft[K]) {
    onChange({ ...draft, [key]: value });
  }

  return (
    <>
      <div className="field">
        <label>{t('wine.batchName')}</label>
        <input
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder={t('wine.batchNamePlaceholder')}
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label>{t('wine.vintage')}</label>
          <input value={draft.vintage} inputMode="numeric" onChange={(e) => set('vintage', e.target.value)} />
        </div>
        <div className="field">
          <label>{t('wine.startDate')}</label>
          <DateField
            value={draft.startDate}
            clearable={false}
            onChange={(value) => set('startDate', value ?? draft.startDate)}
          />
        </div>
      </div>

      <div className="field">
        <label>{t('wine.notes')}</label>
        <textarea value={draft.notes} rows={2} onChange={(e) => set('notes', e.target.value)} />
      </div>
    </>
  );
}
