import { Route } from 'react-router-dom';

import type { StockArea } from '@/config/stock-areas';
import { WINE_BOTTLES_PATH, WINE_CELLAR_PATH } from '@/config/wine';
import { StockBalancePage } from '@/pages/farm/balance/stock-balance-page';
import { WineBalancePage } from '@/pages/farm/balance/wine-balance-page';
import { SeedHistoryPage } from '@/pages/farm/seed-history-page';
import { StockHistoryPage } from '@/pages/farm/stock-history-page';
import { StockPage } from '@/pages/farm/stock-page';
import { HarvestGradingPage } from '@/pages/harvest/grading/harvest-grading-page';
import { HarvestDetailPage } from '@/pages/harvest/harvest-detail-page';
import { HarvestWorkspacePage } from '@/pages/harvest/workspace/harvest-workspace-page';
import { WineBatchPage } from '@/pages/wine/batch/wine-batch-page';
import { WineBottlesPage } from '@/pages/wine/bottles/wine-bottles-page';
import { WineCellarPage } from '@/pages/wine/cellar/wine-cellar-page';
import { ConfigRoute } from '@/routes/config-route';

export function stockAreaRoutes(area: StockArea) {
  return (
    <Route key={area.category} element={<ConfigRoute name={area.config} />}>
      <Route path={area.stockPath} element={<StockPage key={area.category} area={area} />} />
      <Route
        path={area.balancePath}
        element={area.category === 'Wine' ? <WineBalancePage /> : <StockBalancePage key={area.category} area={area} />}
      />
      <Route path={`${area.stockPath}/:id`} element={<StockHistoryPage />} />
      {area.seed && <Route path={`${area.seed.path}/:id`} element={<SeedHistoryPage />} />}
      <Route path={area.harvestPath} element={<HarvestWorkspacePage key={area.category} kind={area.harvestKind} />} />
      <Route path={`${area.harvestDetailBase}/:id`} element={<HarvestDetailPage />} />
      {area.category === 'Crop' && <Route path="/harvest/grading/:id" element={<HarvestGradingPage />} />}
      {area.category === 'Wine' && <Route path={WINE_CELLAR_PATH} element={<WineCellarPage />} />}
      {area.category === 'Wine' && <Route path={`${WINE_CELLAR_PATH}/:id`} element={<WineBatchPage />} />}
      {area.category === 'Wine' && <Route path={WINE_BOTTLES_PATH} element={<WineBottlesPage />} />}
    </Route>
  );
}
