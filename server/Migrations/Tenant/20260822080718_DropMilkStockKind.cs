using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropMilkStockKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM ""StockKinds"" AS sk
WHERE sk.""Id"" = 3
  AND lower(sk.""Name"") = 'milk'
  AND NOT EXISTS (SELECT 1 FROM ""Stocks"" s WHERE lower(s.""Type"") = lower(sk.""Name""))
  AND NOT EXISTS (SELECT 1 FROM ""Seeds"" sd WHERE lower(sd.""Type"") = lower(sk.""Name""))
  AND NOT EXISTS (SELECT 1 FROM ""GreenhouseStocks"" gs WHERE lower(gs.""Type"") = lower(sk.""Name""))
  AND NOT EXISTS (SELECT 1 FROM ""GreenhouseSeeds"" gsd WHERE lower(gsd.""Type"") = lower(sk.""Name""))
  AND NOT EXISTS (SELECT 1 FROM ""LandPlots"" lp WHERE lower(lp.""Crop"") = lower(sk.""Name""));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT INTO ""StockKinds"" (""Id"", ""ImagePath"", ""Name"")
VALUES (3, '', 'Milk')
ON CONFLICT (""Id"") DO NOTHING;");
        }
    }
}
