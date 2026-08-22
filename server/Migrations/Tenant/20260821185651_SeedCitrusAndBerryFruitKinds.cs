using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class SeedCitrusAndBerryFruitKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Same treatment as SeedMoreFruitKinds: a duplicate key here would throw inside the
            // login that applies it, and the sequence has to be walked past the explicit ids or the
            // next kind a user adds collides with one of them.
            migrationBuilder.Sql(
                """
                INSERT INTO "FruitKinds" ("Id", "Name", "ImagePath") VALUES
                    (14, 'Cherry', ''),
                    (15, 'Fig', ''),
                    (16, 'Lemon', ''),
                    (17, 'Mandarin', '')
                ON CONFLICT DO NOTHING;
                """);

            migrationBuilder.Sql(
                """
                SELECT setval(pg_get_serial_sequence('"FruitKinds"', 'Id'), (SELECT MAX("Id") FROM "FruitKinds"));
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 17);
        }
    }
}
