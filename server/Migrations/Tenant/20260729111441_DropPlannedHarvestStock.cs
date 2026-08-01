using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropPlannedHarvestStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A plan is a forecast, so it no longer moves stock — only a recorded result does.
            // Movements a planned item wrote under the old rule are taken back off the balances
            // they inflated and removed, leaving each harvest contributing its results alone.
            migrationBuilder.Sql(@"
UPDATE ""Stocks"" AS s
SET ""Amount"" = s.""Amount"" - planned.total
FROM (
    SELECT ""StockId"", SUM(""Delta"") AS total
    FROM ""StockMovements""
    WHERE ""HarvestItemId"" IS NOT NULL
    GROUP BY ""StockId""
) AS planned
WHERE s.""Id"" = planned.""StockId"";");

            migrationBuilder.Sql(@"DELETE FROM ""StockMovements"" WHERE ""HarvestItemId"" IS NOT NULL;");

            migrationBuilder.Sql(@"
UPDATE ""TreeStocks"" AS ts
SET ""Amount"" = ts.""Amount"" - planned.total
FROM (
    SELECT ""TreeStockId"", SUM(""Delta"") AS total
    FROM ""TreeStockMovements""
    WHERE ""HarvestItemId"" IS NOT NULL
    GROUP BY ""TreeStockId""
) AS planned
WHERE ts.""Id"" = planned.""TreeStockId"";");

            migrationBuilder.Sql(@"DELETE FROM ""TreeStockMovements"" WHERE ""HarvestItemId"" IS NOT NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // The movements this removed are gone with the amounts they carried, so there is
            // nothing to put back — the schema is unchanged either way.
        }
    }
}
