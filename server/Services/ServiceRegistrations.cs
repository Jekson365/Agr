using Server.Models;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services.Interfaces;

namespace Server.Services;

public static class ServiceRegistrations
{
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IFarmRepository, FarmRepository>();
        services.AddScoped<ILivestockRepository, LivestockRepository>();
        services.AddScoped<ILivestockDetailRepository, LivestockDetailRepository>();
        services.AddScoped<IBreedingEventRepository, BreedingEventRepository>();
        services.AddScoped<ILivestockMovementRepository, LivestockMovementRepository>();
        services.AddScoped<ILandPlotRepository, LandPlotRepository>();
        services.AddScoped<IStockRepository, StockRepository>();
        services.AddScoped<IConfigurationRepository, ConfigurationRepository>();
        services.AddScoped<IGreenhouseRepository, GreenhouseRepository>();
        services.AddScoped<IGreenhouseHarvestRepository, GreenhouseHarvestRepository>();
        services.AddScoped<IGreenhouseStockRepository, GreenhouseStockRepository>();
        services.AddScoped<IGreenhouseStockMovementRepository, GreenhouseStockMovementRepository>();
        services.AddScoped<IGreenhouseSeedRepository, GreenhouseSeedRepository>();
        services.AddScoped<IGreenhouseHarvestItemRepository, GreenhouseHarvestItemRepository>();
        services.AddScoped<IGreenhouseHarvestSeedRepository, GreenhouseHarvestSeedRepository>();
        services.AddScoped<IGreenhouseHarvestResultRepository, GreenhouseHarvestResultRepository>();
        services.AddScoped<IGreenhouseHarvestChemicalRepository, GreenhouseHarvestChemicalRepository>();
        services.AddScoped<IGreenhouseFloorRepository, GreenhouseFloorRepository>();
        services.AddScoped<IGreenhouseSectionRepository, GreenhouseSectionRepository>();
        services.AddScoped<IGreenhouseSectionStockRepository, GreenhouseSectionStockRepository>();
        services.AddScoped<IStockKindRepository, StockKindRepository>();
        services.AddScoped<ILivestockKindRepository, LivestockKindRepository>();
        services.AddScoped<IFruitKindRepository, FruitKindRepository>();
        services.AddScoped<IStockMovementRepository, StockMovementRepository>();
        services.AddScoped<ISeedMovementRepository, SeedMovementRepository>();
        services.AddScoped<ISeedRepository, SeedRepository>();
        services.AddScoped<IHarvestSeedRepository, HarvestSeedRepository>();
        services.AddScoped<IWineBatchRepository, WineBatchRepository>();
        services.AddScoped<IWineBatchGrapeRepository, WineBatchGrapeRepository>();
        services.AddScoped<IWineMovementRepository, WineMovementRepository>();
        services.AddScoped<IWineRecordRepository<WineMeasurement>, WineMeasurementRepository>();
        services.AddScoped<IWineRecordRepository<WineBottling>, WineBottlingRepository>();
        services.AddScoped<IWineRecordRepository<WineOperation>, WineOperationRepository>();
        services.AddScoped<IHarvestTreeRepository, HarvestTreeRepository>();
        services.AddScoped<IHarvestChemicalRepository, HarvestChemicalRepository>();
        services.AddScoped<IHarvestEventRepository, HarvestEventRepository>();
        services.AddScoped<IHarvestStatusChangeRepository, HarvestStatusChangeRepository>();
        services.AddScoped<ITreeSeedlingRepository, TreeSeedlingRepository>();
        services.AddScoped<IOrchardBlockRepository, OrchardBlockRepository>();
        services.AddScoped<ITreeTreatmentRepository, TreeTreatmentRepository>();
        services.AddScoped<ITreeSpotTreatmentRepository, TreeSpotTreatmentRepository>();
        services.AddScoped<ITreeProductRepository, TreeProductRepository>();
        services.AddScoped<ITreeProductMovementRepository, TreeProductMovementRepository>();
        services.AddScoped<IHarvestProductRepository, HarvestProductRepository>();
        services.AddScoped<IStockHistoryRepository, StockHistoryRepository>();
        services.AddScoped<IStockPhotoRepository, StockPhotoRepository>();
        services.AddScoped<ISoilInvestigationRepository, SoilInvestigationRepository>();
        services.AddScoped<IMedicalRecordRepository, MedicalRecordRepository>();
        services.AddScoped<IStockFeedRepository, StockFeedRepository>();
        services.AddScoped<ITreeStockRepository, TreeStockRepository>();
        services.AddScoped<ITreeStockMovementRepository, TreeStockMovementRepository>();
        services.AddScoped<IHarvestStockSync, HarvestStockSync>();
        services.AddScoped<IHarvestRepository, HarvestRepository>();
        services.AddScoped<IHarvestItemRepository, HarvestItemRepository>();
        services.AddScoped<IHarvestResultRepository, HarvestResultRepository>();
        services.AddScoped<IHarvestAssessmentRepository, HarvestAssessmentRepository>();
        services.AddScoped<IAssessmentCriteriaRepository, AssessmentCriteriaRepository>();
        services.AddScoped<IProductionTypeRepository, ProductionTypeRepository>();
        services.AddScoped<IUnitRepository, UnitRepository>();
        services.AddScoped<IAnimalProductionRepository, AnimalProductionRepository>();
        services.AddScoped<IProductionMovementRepository, ProductionMovementRepository>();
        services.AddScoped<IPurchaseRepository, PurchaseRepository>();
        services.AddScoped<ICalendarEventRepository, CalendarEventRepository>();
        services.AddScoped<IPlantScanHistoryRepository, PlantScanHistoryRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<IMarketListingRepository, MarketListingRepository>();
        services.AddScoped<INeighbourRepository, NeighbourRepository>();
        services.AddScoped<INeighbourTerritoryService, NeighbourTerritoryService>();
        services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        services.AddScoped<IFileStorageService, FileStorageService>();
        services.AddScoped<ISoilFertilityScoringService, SoilFertilityScoringService>();
        services.AddScoped<IPlanLimitService, PlanLimitService>();
        services.AddScoped<IPlanLimitLock, PlanLimitLock>();
        services.AddScoped<ICoinService, CoinService>();
        services.AddScoped<IMarketSaleInventoryService, MarketSaleInventoryService>();

        return services;
    }
}
