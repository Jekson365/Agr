using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Server.Data;

/// <summary>
/// Design-time factory for the per-user schema. Tenant databases are created by hand, but this lets
/// `dotnet ef --context AppDbContext` generate and apply migrations against a chosen database.
/// The target database name can be passed as the first argument (defaults to a template name);
/// host and credentials are taken from the "master" connection string.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var master = configuration.GetConnectionString("master")!;
        var databaseName = args.Length > 0 ? args[0] : "farm_user_template";
        var connectionString = new NpgsqlConnectionStringBuilder(master) { Database = databaseName }.ConnectionString;

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options);
    }
}
