import { Navigate, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/components/layout/app-shell';
import { LoginPage } from '@/pages/auth/login-page';
import { CalendarPage } from '@/pages/calendar-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { AnimalHistoryPage } from '@/pages/farm/animal-history-page';
// import { BalancePage } from '@/pages/farm/balance-page';
import { EquipmentPage } from '@/pages/farm/equipment-page';
import { FarmPage } from '@/pages/farm/farm-page';
import { FruitsPage } from '@/pages/farm/fruits-page';
import { GreenhouseDetailPage } from '@/pages/farm/greenhouse-detail-page';
// import { GreenhouseHarvestDetailPage } from '@/pages/farm/greenhouse-harvest-detail-page';
import { GreenhouseHarvestPage } from '@/pages/farm/greenhouse-harvest-page';
import { GreenhousePage } from '@/pages/farm/greenhouse-page';
import { GreenhouseSeedsPage } from '@/pages/farm/greenhouse-seeds-page';
import { GreenhouseStockPage } from '@/pages/farm/greenhouse-stock-page';
import { LandDetailPage } from '@/pages/farm/land-detail-page';
import { LandPage } from '@/pages/farm/land-page';
// import { LivestockBalancePage } from '@/pages/farm/livestock-balance-page';
import { LivestockDetailPage } from '@/pages/farm/livestock-detail-page';
import { LivestockPage } from '@/pages/farm/livestock-page';
import { LivestockProductionPage } from '@/pages/farm/livestock-production-page';
import { SeedHistoryPage } from '@/pages/farm/seed-history-page';
import { SeedsPage } from '@/pages/farm/seeds-page';
import { StockHistoryPage } from '@/pages/farm/stock-history-page';
import { StockPage } from '@/pages/farm/stock-page';
import { TreeProductHistoryPage } from '@/pages/farm/tree-product-history-page';
import { TreeProductsPage } from '@/pages/farm/tree-products-page';
import { TreeStockHistoryPage } from '@/pages/farm/tree-stock-history-page';
import { FruitHarvestDetailPage } from '@/pages/harvest/fruit-harvest/fruit-harvest-detail-page';
import { HarvestDetailPage } from '@/pages/harvest/harvest-detail-page';
import { HarvestPage } from '@/pages/harvest/harvest-page';
import { LandingPage } from '@/pages/landing-page';
import { MapPage } from '@/pages/map-page';
import { MarketDetailPage } from '@/pages/market/market-detail-page';
import { MarketPage } from '@/pages/market/market-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { ProfilePage } from '@/pages/profile-page';
import { ReportHarvestPage } from '@/pages/report-harvest-page';
import { ReportPage } from '@/pages/report-page';
import { ReportProductionPage } from '@/pages/report-production-page';
import { ReportStockPage } from '@/pages/report-stock-page';
import { ConfigRoute } from '@/routes/config-route';
import { ProtectedRoute } from '@/routes/protected-route';
import { PublicOnlyRoute } from '@/routes/public-route';
import {
  CALENDAR_CONFIG,
  CROP_FARMING_CONFIG,
  FRUIT_STOCK_CONFIG,
  GREENHOUSE_CONFIG,
  LIVESTOCK_CONFIG,
  MARKETPLACE_CONFIG,
} from '@/types/configuration';
import { BalancePage } from './pages/farm/balance/balance-page';
import { GreenhouseHarvestDetailPage } from './pages/farm/greenhouse-harvest/greenhouse-harvest-detail-page';

function App() {
  return (
    <Routes>
      {/* The marketing page is public in both directions: a signed-in visitor can still read it,
          so it sits outside both guards. It holds the root because that is the one URL strangers
          and search engines arrive at — the app itself lives under /main. */}
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/main" element={<DashboardPage />} />
          <Route path="/farm" element={<FarmPage />} />
          <Route path="/farm/land" element={<LandPage />} />
          <Route path="/farm/land/:id" element={<LandDetailPage />} />
          {/* Each area a tenant setting covers sits behind that setting. Hiding the sidebar entry
              alone would leave the paths reachable by URL, bookmark or an old link. */}
          <Route element={<ConfigRoute name={LIVESTOCK_CONFIG} />}>
            <Route path="/farm/livestock" element={<LivestockPage />} />
            {/* <Route path="/farm/livestock/balance" element={<LivestockBalancePage />} /> */}
            <Route path="/farm/livestock/:id" element={<LivestockDetailPage />} />
            <Route path="/farm/livestock/:livestockId/production" element={<LivestockProductionPage />} />
            <Route path="/farm/livestock/:livestockId/animal/:stockId" element={<AnimalHistoryPage />} />
          </Route>

          {/* Crop farming is the field's whole plant side: what it grows, the seed it sows and the
              stock it holds. The harvest routes live here too — they are the group's own page. */}
          <Route element={<ConfigRoute name={CROP_FARMING_CONFIG} />}>
            <Route path="/farm/stock" element={<StockPage />} />
            <Route path="/farm/stock/:id" element={<StockHistoryPage />} />
            <Route path="/farm/seeds" element={<SeedsPage />} />
            <Route path="/farm/seeds/:id" element={<SeedHistoryPage />} />
            <Route path="/harvest" element={<HarvestPage />} />
            <Route path="/harvest/detail/:id" element={<HarvestDetailPage />} />
          </Route>

          <Route element={<ConfigRoute name={FRUIT_STOCK_CONFIG} />}>
            <Route path="/farm/fruits" element={<FruitsPage />} />
            <Route path="/farm/fruits/harvest" element={<HarvestPage kind="Fruit" />} />
            <Route path="/farm/fruits/harvest/:id" element={<FruitHarvestDetailPage />} />
            <Route path="/farm/fruits/products" element={<TreeProductsPage />} />
            <Route path="/farm/fruits/products/:id" element={<TreeProductHistoryPage />} />
            <Route path="/farm/fruits/:id" element={<TreeStockHistoryPage />} />
          </Route>

          <Route element={<ConfigRoute name={GREENHOUSE_CONFIG} />}>
            <Route path="/farm/greenhouse" element={<GreenhousePage />} />
            <Route path="/farm/greenhouse/:id" element={<GreenhouseDetailPage />} />
            <Route path="/farm/greenhouse/stock" element={<GreenhouseStockPage />} />
            <Route path="/farm/greenhouse/seeds" element={<GreenhouseSeedsPage />} />
            <Route path="/farm/greenhouse/harvest" element={<GreenhouseHarvestPage />} />
            <Route path="/farm/greenhouse/harvest/:id" element={<GreenhouseHarvestDetailPage />} />
          </Route>

          {/* Every outlined field on one map — the user's own land and their neighbourhood's. */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/farm/balance" element={<BalancePage />} />
          <Route path="/farm/equipment" element={<EquipmentPage />} />
          {/* <Route path="/scanner" element={<PlaceholderPage titleKey="dashboard.aiPlantScanner" />} /> */}
          <Route element={<ConfigRoute name={MARKETPLACE_CONFIG} />}>
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/:id" element={<MarketDetailPage />} />
          </Route>
          <Route path="/report" element={<ReportPage />} />
          <Route path="/report/harvest" element={<ReportHarvestPage />} />
          <Route path="/report/production" element={<ReportProductionPage />} />
          <Route path="/report/stock" element={<ReportStockPage />} />
          <Route element={<ConfigRoute name={CALENDAR_CONFIG} />}>
            <Route path="/calendar" element={<CalendarPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}

export default App;