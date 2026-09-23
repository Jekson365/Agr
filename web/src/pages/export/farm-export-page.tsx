import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { useAuth } from '@/contexts/auth-context';
import { useConfiguration } from '@/contexts/configuration-context';
import { useLanguage } from '@/contexts/language-context';
import { CROP_FARMING_CONFIG, FRUIT_STOCK_CONFIG, GREENHOUSE_CONFIG, LIVESTOCK_CONFIG } from '@/types/configuration';
import { ExportSection } from './export-section';
import { ExportSummary } from './export-summary';
import {
  equipmentTable,
  greenhousesTable,
  landsTable,
  livestockTable,
  plotsTable,
  seedsTable,
  stockTable,
  treeStockTable,
  type ExportTable,
} from './export-tables';
import { useFarmExport } from './use-farm-export';
import './farm-export.css';

export function FarmExportPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isOn } = useConfiguration();
  const { data, loading, error, reload } = useFarmExport();

  const tables: ExportTable[] = [landsTable(data, t), plotsTable(data, t)];
  if (isOn(CROP_FARMING_CONFIG)) {
    tables.push(stockTable(data, t), seedsTable(data, t));
  }
  if (isOn(FRUIT_STOCK_CONFIG)) {
    tables.push(treeStockTable(data, t));
  }
  if (isOn(LIVESTOCK_CONFIG)) {
    tables.push(livestockTable(data, t));
  }
  if (isOn(GREENHOUSE_CONFIG)) {
    tables.push(greenhousesTable(data, t));
  }
  if (user?.equipmentAllowed) {
    tables.push(equipmentTable(data, t));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('export.title')}</h1>
        <button type="button" className="add-button" onClick={() => window.print()} disabled={loading || error != null}>
          {t('export.print')}
        </button>
      </div>

      <p className="fx-intro">{t('export.intro')}</p>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('export.loadError')}</span>
          <button type="button" className="retry-button" onClick={reload}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="farm-export">
          <ExportSummary data={data} />
          {tables.map((table) => (
            <ExportSection key={table.title} title={table.title} columns={table.columns} rows={table.rows} />
          ))}
        </div>
      )}
    </div>
  );
}
