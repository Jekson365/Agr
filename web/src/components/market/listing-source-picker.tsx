import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import type { ListingSourceKind } from '@/types/market-listing';
import { loadSources, SOURCE_KIND_OPTIONS, type ListingSource } from './listing-source-options';

type Props = {
  selected: ListingSource | null;
  onSelect: (source: ListingSource | null) => void;
};

export function ListingSourcePicker({ selected, onSelect }: Props) {
  const { t } = useLanguage();

  const [kind, setKind] = useState<ListingSourceKind | null>(null);
  const [options, setOptions] = useState<ListingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!kind) {
      setOptions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    loadSources(kind, t)
      .then((rows) => {
        if (!cancelled) setOptions(rows);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  function pickKind(next: ListingSourceKind) {
    onSelect(null);
    setKind(kind === next ? null : next);
  }

  return (
    <>
      <div className="field field-full">
        <label>{t('market.sourceLabel')}</label>
        <div className="kind-row">
          {SOURCE_KIND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={kind === option.value ? 'kind-chip active' : 'kind-chip'}
              onClick={() => pickKind(option.value)}
            >
              <span>{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
        <span className="limit-hint">{t('market.sourceHint')}</span>
      </div>

      {kind && (
        <div className="field field-full">
          <label>{t('market.sourceItemLabel')}</label>
          {loading ? (
            <span className="limit-hint">…</span>
          ) : error ? (
            <span className="limit-hint">{t('market.sourceLoadError')}</span>
          ) : options.length === 0 ? (
            <span className="limit-hint">{t('market.sourceEmpty')}</span>
          ) : (
            <select
              value={selected ? `${selected.id}:${selected.unitId ?? ''}` : ''}
              onChange={(e) => onSelect(options.find((o) => `${o.id}:${o.unitId ?? ''}` === e.target.value) ?? null)}
            >
              <option value="">{t('market.sourceNone')}</option>
              {options.map((option) => (
                <option key={`${option.id}:${option.unitId ?? ''}`} value={`${option.id}:${option.unitId ?? ''}`}>
                  {option.label} — {option.amount} {option.unitLabel}
                </option>
              ))}
            </select>
          )}
        </div>
      )}
    </>
  );
}
