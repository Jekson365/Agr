using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <summary>
    /// Adds Rooster to the seeded livestock catalog.
    /// </summary>
    /// <remarks>
    /// Hand-written rather than EF's generated <c>InsertData</c>, which hard-codes
    /// <c>Id = 11</c> and would throw on any tenant that already spent that id on a kind of their
    /// own — <c>LivestockKinds.Id</c> is an identity column, so the first custom kind a tenant
    /// added took 11. The insert is therefore conditional on both the id and the name being free,
    /// and the sequence is nudged past the row afterwards so the next custom kind does not collide
    /// with it either.
    ///
    /// A tenant whose id 11 is already taken keeps their own row and does not get the built-in;
    /// they can still add a rooster as a custom kind, exactly as they could before.
    /// </remarks>
    public partial class SeedRoosterLivestockKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO "LivestockKinds" ("Id", "Name", "ImagePath")
                SELECT 11, 'Rooster', ''
                WHERE NOT EXISTS (
                    SELECT 1 FROM "LivestockKinds"
                    WHERE "Id" = 11 OR lower("Name") = 'rooster'
                );
                """);

            // The identity sequence is only advanced by inserts that let it assign the id, so a
            // row written with an explicit 11 leaves it able to hand 11 out again.
            migrationBuilder.Sql("""
                SELECT setval(
                    pg_get_serial_sequence('"LivestockKinds"', 'Id'),
                    GREATEST((SELECT MAX("Id") FROM "LivestockKinds"), 1)
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Only the seeded row, and only while nothing is recorded against it — a herd refers to
            // its kind by name, and dropping one still in use would leave those rows unnameable.
            migrationBuilder.Sql("""
                DELETE FROM "LivestockKinds"
                WHERE "Id" = 11
                  AND "Name" = 'Rooster'
                  AND NOT EXISTS (
                      SELECT 1 FROM "Livestock" WHERE lower("Type") = 'rooster'
                  );
                """);
        }
    }
}
