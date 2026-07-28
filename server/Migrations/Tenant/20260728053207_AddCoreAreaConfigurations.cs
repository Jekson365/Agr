using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddCoreAreaConfigurations : Migration
    {
        /// <inheritdoc />
        /// <remarks>
        /// Hand-written rather than the generated InsertData. An earlier build of this migration
        /// shipped a `stock` setting and was applied to tenant databases before being replaced by
        /// `CropFarming`; a plain insert would then collide on the ids those rows already hold and
        /// fail the whole migration. This form reaches the same end state from either start:
        ///
        ///   - the superseded `stock` row is dropped, freeing its id,
        ///   - each setting is inserted only if it is not already there, so a tenant that has
        ///     already switched one off keeps that choice.
        /// </remarks>
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM "Configurations" WHERE "Name" = 'stock';

                INSERT INTO "Configurations" ("Id", "Name", "Value")
                VALUES (2, 'CropFarming', 1),
                       (3, 'livestock', 1),
                       (4, 'fruitstock', 1),
                       (5, 'marketplace', 1),
                       (6, 'calendar', 1)
                ON CONFLICT DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Configurations",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Configurations",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Configurations",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Configurations",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Configurations",
                keyColumn: "Id",
                keyValue: 6);
        }
    }
}
