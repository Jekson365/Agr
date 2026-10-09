import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import qvevriIcon from '@/assets/icons/qvevri.svg';
import '@/components/farm/farm-crud.css';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { WINE_CELLAR_PATH } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/detail/harvest-detail-panels.css';
import type { WineStage } from '@/types/wine';
import { useWineBatch } from './use-wine-batch';
import { WineBatchKpis } from './wine-batch-kpis';
import { WineBottlingSection } from './wine-bottling-section';
import { WineGrapesSection } from './wine-grapes-section';
import { WineHistorySection } from './wine-history-section';
import { WineMoneySection } from './wine-money-section';
import { WineReadingsSection } from './wine-readings-section';
import { WineSectionTabs } from './wine-section-tabs';
import { WINE_SECTIONS, type WineSection } from './wine-sections';
import { WineStageBar } from './wine-stage-bar';
import { WineWorkSection } from './wine-work-section';
import './wine-batch.css';

export function WineBatchPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const detail = useWineBatch(Number(id));
  const { batch } = detail;

  const [section, setSection] = useState<WineSection>('grapes');
  const [pendingStage, setPendingStage] = useState<WineStage | null>(null);

  function handleStageSelect(stage: WineStage) {
    if (stage === 'Stocked') {
      setPendingStage(stage);
    } else {
      detail.changeStage(stage);
    }
  }

  function confirmStage() {
    const next = pendingStage;
    setPendingStage(null);
    if (next) detail.changeStage(next);
  }

  if (detail.loading && !batch) {
    return <div className="state-box">…</div>;
  }

  if (!batch) {
    return (
      <div className="state-box">
        <span>{t('farm.loadError')}</span>
        <button type="button" className="retry-button" onClick={detail.load}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="wine-batch-page">
      <Link to={WINE_CELLAR_PATH} className="hd-back">
        ← {t('wine.cellarTitle')}
      </Link>

      <header className="wine-batch-head">
        <img src={qvevriIcon} alt="" />
        <div>
          <h1 className="page-title">{batch.name}</h1>
          <span className="wine-batch-sub">
            {batch.vintage}
            {batch.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
          </span>
        </div>
      </header>

      {detail.error && <div className="error-banner">{detail.error}</div>}

      <WineStageBar
        stage={batch.stage}
        changes={detail.stages}
        saving={detail.stageSaving}
        disabled={batch.isDeleted || batch.stage === 'Stocked'}
        onSelect={handleStageSelect}
      />

      <WineBatchKpis batch={batch} />

      <WineSectionTabs
        sections={WINE_SECTIONS}
        active={section}
        counts={{ grapes: detail.grapes.length, readings: batch.readingCount, bottling: batch.bottlingCount, work: batch.operationCount, history: detail.movements.length }}
        onSelect={setSection}
      />

      {section === 'grapes' && <WineGrapesSection detail={detail} />}
      {section === 'readings' && (
        <WineReadingsSection batchId={batch.id} canEdit={!batch.isDeleted} onChanged={detail.refresh} />
      )}
      {section === 'work' && <WineWorkSection batch={batch} onChanged={detail.refresh} />}
      {section === 'bottling' && <WineBottlingSection batch={batch} onChanged={detail.refresh} />}
      {section === 'money' && <WineMoneySection batch={batch} />}
      {section === 'history' && <WineHistorySection detail={detail} />}

      <ConfirmModal
        open={pendingStage === 'Stocked'}
        title={t('wine.stockedConfirmTitle')}
        body={t('wine.stockedConfirmBody')}
        confirmLabel={t('wine.stageStocked')}
        onCancel={() => setPendingStage(null)}
        onConfirm={confirmStage}
      />
    </div>
  );
}
