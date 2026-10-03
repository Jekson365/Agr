using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class SeedGrapeStockKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                INSERT INTO "StockKinds" ("Id", "Name", "ImagePath")
                SELECT 13, 'Grape', ''
                WHERE NOT EXISTS (SELECT 1 FROM "StockKinds" WHERE lower("Name") IN ('grape', 'ყურძენი'))
                ON CONFLICT DO NOTHING;
                """);

            migrationBuilder.Sql(
                """
                SELECT setval(pg_get_serial_sequence('"StockKinds"', 'Id'), (SELECT MAX("Id") FROM "StockKinds"));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 13);
        }
    }
}
