import { useLanguage } from '@/contexts/language-context';
import type { AdminRecordCounts } from '@/types/admin-details';
import './user-detail-activity.css';

const RECORDS: { key: keyof AdminRecordCounts; labelKey: string }[] = [
  { key: 'animals', labelKey: 'managerUser.recordAnimals' },
  { key: 'productions', labelKey: 'managerUser.recordProductions' },
  { key: 'purchases', labelKey: 'managerUser.recordPurchases' },
  { key: 'calendarEvents', labelKey: 'managerUser.recordCalendar' },
  { key: 'harvestEvents', labelKey: 'managerUser.recordHarvestEvents' },
  { key: 'plantScans', labelKey: 'managerUser.recordPlantScans' },
];

type Props = {
  records: AdminRecordCounts;
};

export function UserDetailRecords({ records }: Props) {
  const { t } = useLanguage();

  return (
    <section className="user-detail-card user-detail-records-card">
      <h2 className="user-detail-title">{t('managerUser.records')}</h2>
      <ul className="user-detail-records">
        {RECORDS.map((record) => (
          <li key={record.key} className="user-detail-record">
            <strong>{records[record.key]}</strong>
            <span>{t(record.labelKey)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
