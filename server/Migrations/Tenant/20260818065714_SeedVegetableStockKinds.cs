using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <summary>
    /// Adds Carrot, Corn and Onion to the seeded stock catalog.
    /// </summary>
    /// <remarks>
    /// Hand-written for the same reason as <see cref="SeedRoosterLivestockKind"/>: EF's generated
    /// <c>InsertData</c> hard-codes <c>Id = 10..12</c> and would throw on any tenant that already
    /// spent those ids on kinds of their own — <c>StockKinds.Id</c> is an identity column, so the
    /// first custom kind a tenant added took 10. Each insert is therefore conditional on both the
    /// id and the name being free, and the sequence is nudged past the rows afterwards so the next
    /// custom kind does not collide with them either.
    ///
    /// A tenant whose ids are already taken keeps their own rows and does not get the built-ins;
    /// they can still add these as custom kinds, exactly as they could before.
    /// </remarks>
    public partial class SeedVegetableStockKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "StockKinds" ("Id", "Name", "ImagePath")
                SELECT 10, 'Carrot', ''
                WHERE NOT EXISTS (
                    SELECT 1 FROM "StockKinds"
                    WHERE "Id" = 10 OR lower("Name") = 'carrot'
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "StockKinds" ("Id", "Name", "ImagePath")
                SELECT 11, 'Corn', ''
                WHERE NOT EXISTS (
                    SELECT 1 FROM "StockKinds"
                    WHERE "Id" = 11 OR lower("Name") = 'corn'
                );
                """);

            migrationBuilder.Sql("""
                INSERT INTO "StockKinds" ("Id", "Name", "ImagePath")
                SELECT 12, 'Onion', ''
                WHERE NOT EXISTS (
                    SELECT 1 FROM "StockKinds"
                    WHERE "Id" = 12 OR lower("Name") = 'onion'
                );
                """);

            // The identity sequence is only advanced by inserts that let it assign the id, so rows
            // written with explicit ids leave it able to hand those ids out again.
            migrationBuilder.Sql("""
                SELECT setval(
                    pg_get_serial_sequence('"StockKinds"', 'Id'),
                    GREATEST((SELECT MAX("Id") FROM "StockKinds"), 1)
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Only the seeded rows, and only while nothing is recorded against them — stock, seeds
            // and their greenhouse counterparts all refer to a kind by name, and dropping one still
            // in use would leave those rows unnameable.
            migrationBuilder.Sql("""
                DELETE FROM "StockKinds" k
                WHERE (k."Id", k."Name") IN ((10, 'Carrot'), (11, 'Corn'), (12, 'Onion'))
                  AND NOT EXISTS (SELECT 1 FROM "Stocks"           t WHERE lower(t."Type") = lower(k."Name"))
                  AND NOT EXISTS (SELECT 1 FROM "Seeds"            t WHERE lower(t."Type") = lower(k."Name"))
                  AND NOT EXISTS (SELECT 1 FROM "GreenhouseStocks" t WHERE lower(t."Type") = lower(k."Name"))
                  AND NOT EXISTS (SELECT 1 FROM "GreenhouseSeeds"  t WHERE lower(t."Type") = lower(k."Name"));
                """);
        }
    }
}
