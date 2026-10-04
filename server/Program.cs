using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Server.Data;
using Server.Integrations.OpenAi;
using Server.Integrations.SmsService;
using Server.Integrations.WeatherApi;
using Server.Models.Bog;
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
    options.UseNpgsql(sp.GetRequiredService<ITenantConnectionProvider>().GetConnectionString())
        .AddInterceptors(sp.GetRequiredService<TenantReadyInterceptor>()));

builder.Services.AddScoped<ICurrentTenant, CurrentTenant>();
builder.Services.AddScoped<ITenantConnectionProvider, TenantConnectionProvider>();
builder.Services.AddScoped<ITenantDatabaseProvisioner, TenantDatabaseProvisioner>();
builder.Services.AddSingleton<TenantProvisioningQueue>();
builder.Services.AddSingleton<ITenantProvisioningQueue>(sp => sp.GetRequiredService<TenantProvisioningQueue>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<TenantProvisioningQueue>());
builder.Services.AddSingleton<TenantReadyInterceptor>();
builder.Services.AddScoped<ITokenService, TokenService>();

builder.Services.AddDomainServices();
builder.Services.AddVisitTracking(builder.Configuration);
builder.Services.AddNewUserNotices(builder.Configuration);

// WeatherAPI.com integration (see server/Integrations/WeatherApi). Registered as a typed
// HttpClient so the API key stays server-side and calls are pooled/retried by the factory.
builder.Services.Configure<WeatherApiOptions>(builder.Configuration.GetSection(WeatherApiOptions.SectionName));
builder.Services.AddHttpClient<IWeatherClient, WeatherApiClient>((sp, client) =>
{
    var weatherOptions = sp.GetRequiredService<IOptions<WeatherApiOptions>>().Value;
    client.BaseAddress = new Uri(weatherOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// smsservice.ge integration (see server/Integrations/SmsService), behind registering by phone.
// A typed HttpClient again, so the account details never leave the server.
builder.Services.Configure<SmsServiceOptions>(builder.Configuration.GetSection(SmsServiceOptions.SectionName));
builder.Services.AddHttpClient<ISmsSender, SmsServiceClient>((sp, client) =>
{
    var smsOptions = sp.GetRequiredService<IOptions<SmsServiceOptions>>().Value;
    client.BaseAddress = new Uri(smsOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(15);
});
builder.Services.AddScoped<IPhoneVerificationService, PhoneVerificationService>();

// OpenAI integration (see server/Integrations/OpenAi). Registered as a typed HttpClient so the
// API key stays server-side and calls are pooled/retried by the factory.
builder.Services.Configure<OpenAiOptions>(builder.Configuration.GetSection(OpenAiOptions.SectionName));
builder.Services.AddHttpClient<IPlantScanClient, OpenAiPlantScanClient>((sp, client) =>
{
    var openAiOptions = sp.GetRequiredService<IOptions<OpenAiOptions>>().Value;
    client.BaseAddress = new Uri(openAiOptions.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(60);
});

// Bank of Georgia e-commerce integration, behind buying a marketplace listing. The merchant secret
// never leaves the server: the marketplace SPA bakes its entire config into the bundle, so every
// call to the bank is made from here.
//
// A named client plus a singleton service, rather than the typed-client shorthand the three above
// use. The service caches the bank's access token — good for the best part of an hour — and a
// scoped service would throw that away on every checkout. A singleton cannot take a typed
// HttpClient, so it takes the factory and asks for this client by name.
builder.Services.Configure<BogOptions>(builder.Configuration.GetSection(BogOptions.SectionName));
builder.Services.AddHttpClient(BogPaymentService.HttpClientName, (sp, client) =>
{
    var bogOptions = sp.GetRequiredService<IOptions<BogOptions>>().Value;
    client.BaseAddress = new Uri(bogOptions.ApiBaseUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddSingleton<IBogPaymentService, BogPaymentService>();

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

app.UseVisitTracking();
app.UseCors("ExpoClient");

app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();

// After authorization, so it has the caller's identity and only ever answers a request that was
// already going to be served.
app.UseMiddleware<Server.Services.ManagementAccessMiddleware>();

app.MapControllers();

app.Run();
