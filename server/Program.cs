using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Integrations.OpenAi;
using Server.Integrations.WeatherApi;
using Server.Repositories;
using Server.Repositories.Interfaces;
using Server.Services;
using Server.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddHttpContextAccessor();

// Shared master database (global user list).
builder.Services.AddDbContext<MasterDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("master")));

// Per-user domain database; the connection is resolved per request from the caller's user id.
builder.Services.AddDbContext<AppDbContext>((sp, options) =>
    options.UseNpgsql(sp.GetRequiredService<ITenantConnectionProvider>().GetConnectionString()));

builder.Services.AddScoped<ICurrentTenant, CurrentTenant>();
builder.Services.AddScoped<ITenantConnectionProvider, TenantConnectionProvider>();
builder.Services.AddScoped<ITenantDatabaseProvisioner, TenantDatabaseProvisioner>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IFarmRepository, FarmRepository>();
builder.Services.AddScoped<ILivestockRepository, LivestockRepository>();
builder.Services.AddScoped<ILivestockDetailRepository, LivestockDetailRepository>();
builder.Services.AddScoped<ILandPlotRepository, LandPlotRepository>();
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<IConfigurationRepository, ConfigurationRepository>();
builder.Services.AddScoped<IGreenhouseRepository, GreenhouseRepository>();
builder.Services.AddScoped<IGreenhouseHarvestRepository, GreenhouseHarvestRepository>();
builder.Services.AddScoped<IGreenhouseStockRepository, GreenhouseStockRepository>();
builder.Services.AddScoped<IGreenhouseSeedRepository, GreenhouseSeedRepository>();
builder.Services.AddScoped<IGreenhouseHarvestItemRepository, GreenhouseHarvestItemRepository>();
builder.Services.AddScoped<IGreenhouseHarvestSeedRepository, GreenhouseHarvestSeedRepository>();
builder.Services.AddScoped<IGreenhouseHarvestResultRepository, GreenhouseHarvestResultRepository>();
builder.Services.AddScoped<IGreenhouseHarvestChemicalRepository, GreenhouseHarvestChemicalRepository>();
builder.Services.AddScoped<IGreenhouseFloorRepository, GreenhouseFloorRepository>();
builder.Services.AddScoped<IGreenhouseSectionRepository, GreenhouseSectionRepository>();
builder.Services.AddScoped<IGreenhouseSectionStockRepository, GreenhouseSectionStockRepository>();
builder.Services.AddScoped<IStockKindRepository, StockKindRepository>();
builder.Services.AddScoped<ILivestockKindRepository, LivestockKindRepository>();
builder.Services.AddScoped<IFruitKindRepository, FruitKindRepository>();
builder.Services.AddScoped<IStockMovementRepository, StockMovementRepository>();
builder.Services.AddScoped<ISeedMovementRepository, SeedMovementRepository>();
builder.Services.AddScoped<ISeedRepository, SeedRepository>();
builder.Services.AddScoped<IHarvestSeedRepository, HarvestSeedRepository>();
builder.Services.AddScoped<IHarvestTreeRepository, HarvestTreeRepository>();
builder.Services.AddScoped<IHarvestChemicalRepository, HarvestChemicalRepository>();
builder.Services.AddScoped<ITreeProductRepository, TreeProductRepository>();
builder.Services.AddScoped<ITreeProductMovementRepository, TreeProductMovementRepository>();
builder.Services.AddScoped<IHarvestProductRepository, HarvestProductRepository>();
builder.Services.AddScoped<IStockHistoryRepository, StockHistoryRepository>();
builder.Services.AddScoped<IStockPhotoRepository, StockPhotoRepository>();
builder.Services.AddScoped<IMedicalRecordRepository, MedicalRecordRepository>();
builder.Services.AddScoped<IStockFeedRepository, StockFeedRepository>();
builder.Services.AddScoped<ITreeStockRepository, TreeStockRepository>();
builder.Services.AddScoped<ITreeStockMovementRepository, TreeStockMovementRepository>();
builder.Services.AddScoped<IHarvestStockSync, HarvestStockSync>();
builder.Services.AddScoped<IHarvestRepository, HarvestRepository>();
builder.Services.AddScoped<IHarvestItemRepository, HarvestItemRepository>();
builder.Services.AddScoped<IHarvestResultRepository, HarvestResultRepository>();
builder.Services.AddScoped<IProductionTypeRepository, ProductionTypeRepository>();  
builder.Services.AddScoped<IUnitRepository, UnitRepository>();
builder.Services.AddScoped<IAnimalProductionRepository, AnimalProductionRepository>();
builder.Services.AddScoped<IProductionMovementRepository, ProductionMovementRepository>();
builder.Services.AddScoped<ICalendarEventRepository, CalendarEventRepository>();
builder.Services.AddScoped<IPlantScanHistoryRepository, PlantScanHistoryRepository>();
builder.Services.AddScoped<IReportRepository, ReportRepository>();
builder.Services.AddScoped<IMarketListingRepository, MarketListingRepository>();
builder.Services.AddScoped<INeighbourRepository, NeighbourRepository>();
builder.Services.AddScoped<INeighbourTerritoryService, NeighbourTerritoryService>();
builder.Services.AddScoped<IEquipmentRepository, EquipmentRepository>();
builder.Services.AddScoped<IFileStorageService, FileStorageService>();
builder.Services.AddScoped<IPlanLimitService, PlanLimitService>();

// WeatherAPI.com integration (see server/Integrations/WeatherApi). Registered as a typed
// HttpClient so the API key stays server-side and calls are pooled/retried by the factory.
builder.Services.Configure<WeatherApiOptions>(builder.Configuration.GetSection(WeatherApiOptions.SectionName));
builder.Services.AddHttpClient<IWeatherClient, WeatherApiClient>((sp, client) =>
{
    var weatherOptions = sp.GetRequiredService<IOptions<WeatherApiOptions>>().Value;
    client.BaseAddress = new Uri(weatherOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// OpenAI integration (see server/Integrations/OpenAi). Registered as a typed HttpClient so the
// API key stays server-side and calls are pooled/retried by the factory.
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection(OpenAiOptions.SectionName));
builder.Services.AddHttpClient<IPlantScanClient, OpenAiPlantScanClient>((sp, client) =>
{
    var openAiOptions = sp.GetRequiredService<IOptions<OpenAiOptions>>().Value;
    client.BaseAddress = new Uri(openAiOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(60);
});

var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt["Issuer"],
            ValidateAudience = true,
            ValidAudience = jwt["Audience"],
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]!)),
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ExpoClient", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

// Ensure the master database exists and is up to date on startup.
// Per-user databases are created by hand and are never touched here.
using (var scope = app.Services.CreateScope())
{
    var master = scope.ServiceProvider.GetRequiredService<MasterDbContext>();
    await master.Database.MigrateAsync();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("ExpoClient");

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
