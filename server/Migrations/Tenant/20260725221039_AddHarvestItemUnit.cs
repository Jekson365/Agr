using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestItemUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "HarvestItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Rows planned before the unit was stored took it from their target good. Copy that in,
            // otherwise every existing plan renders as a bare number with no unit beside it. Both
            // Stock.Unit and TreeStock.Unit are stored as their readable enum name.
            migrationBuilder.Sql("""
                UPDATE "HarvestItems" AS hi
                SET "Unit" = s."Unit"
                FROM "Stocks" AS s
                WHERE hi."StockId" = s."Id" AND hi."Unit" = '';
                """);

            migrationBuilder.Sql("""
                UPDATE "HarvestItems" AS hi
                SET "Unit" = ts."Unit"
                FROM "TreeStocks" AS ts
                WHERE hi."TreeStockId" = ts."Id" AND hi."Unit" = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Unit",
                table: "HarvestItems");
        }
    }
}
