import { useEffect, useRef, useState } from 'react';

import { ChevronRightIcon } from '@/components/icons/misc-icons';
import { formatAge } from '@/config/age';
import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getSaleAnimals } from '@/services/livestock-detail-service';
import type { SaleAnimal } from '@/types/sale-animal';
import { groupSaleAnimals, type SaleAnimalGroup } from './sale-animals';
import './sale-animal-picker.css';

type Props = {
  selected: SaleAnimal[];
  onChange: (animals: SaleAnimal[]) => void;
};

export function SaleAnimalPicker({ selected, onChange }: Props) {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);

  const [animals, setAnimals] = useState<SaleAnimal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSaleAnimals()
      .then((rows) => {
        if (!cancelled) setAnimals(rows);
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
  }, []);

  useEffect(() => {
    if (!open) return;
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('click', closeOnOutside, true);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('click', closeOnOutside, true);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const selectedIds = new Set(selected.map((animal) => animal.id));
  const groups = groupSaleAnimals(animals, query, t);

  function toggle(animal: SaleAnimal) {
    onChange(
      selectedIds.has(animal.id) ? selected.filter((item) => item.id !== animal.id) : [...selected, animal]
    );
  }

  function toggleGroup(group: SaleAnimalGroup) {
    const ids = new Set(group.animals.map((animal) => animal.id));
    const allChosen = group.animals.every((animal) => selectedIds.has(animal.id));
    onChange(
      allChosen
        ? selected.filter((item) => !ids.has(item.id))
        : [...selected, ...group.animals.filter((animal) => !selectedIds.has(animal.id))]
    );
  }

  function describe(animal: SaleAnimal): string {
    const gender = animal.gender
      ? t(animal.gender === 'Male' ? 'livestockDetail.male' : 'livestockDetail.female')
      : null;
    return [gender, formatAge(animal.bornDate, t)].filter(Boolean).join(' · ');
  }

  function renderGroup(group: SaleAnimalGroup) {
    const chosen = group.animals.filter((animal) => selectedIds.has(animal.id)).length;
    const state = chosen === 0 ? '' : chosen === group.animals.length ? 'checked' : 'mixed';
    return (
      <div key={group.id} className="sale-animals-group" role="group">
        <button
          type="button"
          role="checkbox"
          aria-checked={state === 'mixed' ? 'mixed' : state === 'checked'}
          className={`sale-animals-head ${state}`}
          onClick={() => toggleGroup(group)}
        >
          <span className="sale-animals-box" />
          <img src={livestockImage(group.type)} alt="" />
          <span className="sale-animals-name">{group.name}</span>
          <span className="sale-animals-count">
            {chosen}/{group.animals.length}
          </span>
        </button>
        {group.animals.map((animal) => {
          const checked = selectedIds.has(animal.id);
          return (
            <button
              key={animal.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              className={checked ? 'sale-animals-row checked' : 'sale-animals-row'}
              onClick={() => toggle(animal)}
            >
              <span className="sale-animals-box" />
              <span className="sale-animals-code">{animal.code}</span>
              <span className="sale-animals-meta">{describe(animal)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="field field-full">
      <label>{t('sales.animalsLabel')}</label>
      {loading ? (
        <span className="limit-hint">…</span>
      ) : error ? (
        <span className="limit-hint">{t('market.sourceLoadError')}</span>
      ) : animals.length === 0 ? (
        <span className="limit-hint">{t('sales.animalsEmpty')}</span>
      ) : (
        <div className="sale-animals" ref={rootRef}>
          <button
            type="button"
            className={open ? 'sale-animals-toggle open' : 'sale-animals-toggle'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span>
              {selected.length > 0
                ? t('sales.animalsSelected', { count: selected.length })
                : t('sales.animalsPlaceholder')}
            </span>
            <ChevronRightIcon width={16} height={16} />
          </button>

          {open && (
            <div className="sale-animals-panel">
              <input
                className="sale-animals-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('sales.animalsSearch')}
                autoFocus
              />
              <div className="sale-animals-list">
                {groups.length === 0 ? (
                  <p className="limit-hint">{t('sales.animalsNoMatch')}</p>
                ) : (
                  groups.map(renderGroup)
                )}
              </div>
            </div>
          )}

          {selected.length > 0 && (
            <div className="sale-animals-chips">
              {selected.map((animal) => (
                <button key={animal.id} type="button" className="sale-animals-chip" onClick={() => toggle(animal)}>
                  {animal.code}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
