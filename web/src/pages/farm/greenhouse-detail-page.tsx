import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import greenhousePlaceholder from '@/assets/icons/greenhouse-deafult.png';
import harvestIcon from '@/assets/icons/harvest.png';
import '@/components/farm/farm-crud.css';
import { GreenhousePositioningModal } from '@/components/farm/greenhouse/positioning/greenhouse-positioning-modal';
import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { ChevronRightIcon } from '@/components/icons/misc-icons';
import '@/components/harvest/harvest.css';
import '@/pages/farm/land-detail-page.css';
import './greenhouse-detail-page.css';
import { formatLocalizedIsoDate, formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { HARVEST_STATUS_BADGE_CLASS, HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getGreenhouse } from '@/services/greenhouse-service';
import { getGreenhouseHarvests } from '@/services/greenhouse-harvest-service';
import { getGreenhouseHarvestResults } from '@/services/greenhouse-harvest-result-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { GreenhouseHarvestResult } from '@/types/greenhouse-harvest-result';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

export function GreenhouseDetailPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const greenhouseId = Number(idParam);

  const [greenhouse, setGreenhouse] = useState<Greenhouse | null>(null);
  const [harvests, setHarvests] = useState<GreenhouseHarvest[]>([]);
  const [stocks, setStocks] = useState<GreenhouseStock[]>([]);
  // Each harvest's recorded yield, fetched once up front — a greenhouse's own harvest list is
  // short enough that there's no need to defer it to first-expand, unlike the report page's
  // per-day breakdowns.
  const [resultsByHarvest, setResultsByHarvest] = useState<Record<number, GreenhouseHarvestResult[]>>({});
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positioningOpen, setPositioningOpen] = useState(false);

  useEffect(() => {
    if (!greenhouseId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [greenhouseId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [greenhouseItem, harvestList, stockList] = await Promise.all([
        getGreenhouse(greenhouseId),
        getGreenhouseHarvests(greenhouseId),
        getGreenhouseStock(greenhouseId),
      ]);
      setGreenhouse(greenhouseItem);
      setHarvests(harvestList);
      setStocks(stockList);

      const entries = await Promise.all(
        harvestList.map(async (h) => [h.id, await getGreenhouseHarvestResults(h.id)] as const)
      );
      setResultsByHarvest(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function stockInfo(stockId: number): { label: string; unitLabel: string; icon: string } | null {
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) return null;
    return {
      label: stock.name.trim() || stockTypeLabel(stock.type, t),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit] ?? stock.unit),
      icon: stockKindImage(stock.type),
    };
  }

  return (
    <div>
      <Link to="/farm/greenhouse" className="back-link">
        ← {t('farm.greenhouse')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{greenhouse?.name ?? t('farm.greenhouse')}</h1>
        <button type="button" className="secondary-button" onClick={() => setPositioningOpen(true)}>
          {t('greenhouse.positioning.button')}
        </button>
      </div>

      {greenhouseId > 0 && (
        <GreenhousePositioningModal
          greenhouseId={greenhouseId}
          open={positioningOpen}
          onClose={() => setPositioningOpen(false)}
        />
      )}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('greenhouse.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        greenhouse && (
          <>
            <div className="land-detail-header">
              <img
                src={greenhouse.imagePath ? resolveAssetUrl(greenhouse.imagePath) : greenhousePlaceholder}
                alt=""
                className="land-detail-image"
              />
              <div className="land-detail-facts">
                <div className="list-card-subtitle">
                  {t('farm.area')} {greenhouse.area} {t('farm.areaUnit')}
                </div>
                {greenhouse.establishDate && (
                  <div className="list-card-subtitle">
                    {t('farm.establishDate')}: {formatLocalizedIsoDay(greenhouse.establishDate, language)}
                  </div>
                )}
                {greenhouse.location && (
                  <div className="list-card-subtitle">
                    {t('farm.location')}: {greenhouse.location}
                  </div>
                )}
              </div>
            </div>

            <div className="field harvest-section-label">
              <label>{t('greenhouse.harvestTitle')}</label>
            </div>

            {harvests.length === 0 ? (
              <p className="empty-state">{t('greenhouse.harvestEmpty')}</p>
            ) : (
              <div className="greenhouse-harvest-rows">
                {harvests.map((harvest) => {
                  const isOpen = expandedIds.has(harvest.id);
                  const results = resultsByHarvest[harvest.id] ?? [];
                  return (
                    <div key={harvest.id} className="greenhouse-harvest-group">
                      <div className={isOpen ? 'greenhouse-harvest-row open' : 'greenhouse-harvest-row'}>
                        <button
                          type="button"
                          className="greenhouse-harvest-toggle"
                          onClick={() => toggleExpanded(harvest.id)}
                          aria-expanded={isOpen}
                        >
                          <span className={isOpen ? 'greenhouse-harvest-chevron open' : 'greenhouse-harvest-chevron'}>
                            <ChevronDownIcon width={16} height={16} />
                          </span>
                          <img src={harvestIcon} alt="" className="greenhouse-harvest-icon" />
                          <span className="greenhouse-harvest-info">
                            <span className="greenhouse-harvest-title">{harvest.title}</span>
                            <span className="greenhouse-harvest-meta">
                              {formatLocalizedIsoDate(harvest.date, language)}
                              <span className={`${HARVEST_STATUS_BADGE_CLASS[harvest.status]} harvest-status-badge`}>
                                {t(HARVEST_STATUS_LABEL_KEY[harvest.status])}
                              </span>
                            </span>
                          </span>
                        </button>
                        <Link
                          to={`/farm/greenhouse/harvest/${harvest.id}`}
                          className="greenhouse-harvest-open"
                          aria-label={t('greenhouse.openHarvest')}
                          title={t('greenhouse.openHarvest')}
                        >
                          <ChevronRightIcon width={18} height={18} />
                        </Link>
                      </div>

                      {isOpen && (
                        <div className="greenhouse-harvest-items">
                          {results.length === 0 ? (
                            <p className="empty-state">{t('harvestResult.empty')}</p>
                          ) : (
                            results.map((result) => {
                              const info = stockInfo(result.greenhouseStockId);
                              return (
                                <div key={result.id} className="greenhouse-harvest-item-row">
                                  {info && <img src={info.icon} alt="" className="greenhouse-harvest-item-icon" />}
                                  <span className="greenhouse-harvest-item-label">{info?.label ?? ''}</span>
                                  <span className="greenhouse-harvest-item-amount">
                                    {result.amount} {info?.unitLabel ?? ''}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
