import { useLanguage } from '@/contexts/language-context';

export type ExportColumn = {
  key: string;
  label: string;
  num?: boolean;
};

export type ExportRow = {
  id: string;
  cells: Record<string, string>;
};

type Props = {
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
};

export function ExportSection({ title, columns, rows }: Props) {
  const { t } = useLanguage();

  return (
    <section className="fx-section">
      <h2 className="fx-section-title">
        {title}
        <span className="fx-section-count">{rows.length}</span>
      </h2>

      {rows.length === 0 ? (
        <p className="fx-empty">{t('export.empty')}</p>
      ) : (
        <table className="fx-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.num ? 'num' : undefined}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((column) => (
                  <td key={column.key} className={column.num ? 'num' : undefined}>
                    {row.cells[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
