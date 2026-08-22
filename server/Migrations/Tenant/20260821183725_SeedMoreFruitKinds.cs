using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class SeedMoreFruitKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ON CONFLICT rather than InsertData: a tenant that added a fruit kind of its own
            // before this reached them holds id 4, and a duplicate key here would throw inside the
            // login that applies the migration — locking them out. Skipping the one row that
            // clashes leaves them a kind short, which is recoverable; a failed login is not.
            migrationBuilder.Sql(
                """
                INSERT INTO "FruitKinds" ("Id", "Name", "ImagePath") VALUES
                    (4, 'Avocado', ''),
                    (5, 'Kiwi', ''),
                    (6, 'Melon', ''),
                    (7, 'Nut', ''),
                    (8, 'Peach', ''),
                    (9, 'Pear', ''),
                    (10, 'Pineapple', ''),
                    (11, 'Plum', ''),
                    (12, 'Strawberry', ''),
                    (13, 'Watermelon', '')
                ON CONFLICT DO NOTHING;
                """);

            // The identity sequence does not advance for explicitly-numbered inserts, so without
            // this it still hands out 4 — and the next kind a user adds collides with Avocado.
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
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 13);
        }
    }
}
