using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropLivestockIsRealized : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A group is not realized as a whole any more: realization is one animal's, recorded
            // from that animal for the meat taken off it. Nothing is lost with the column — it was
            // derived from the group's realization records, which stay, and the same query that
            // backfilled it in AddLivestockIsRealized puts it back below.
            migrationBuilder.DropColumn(
                name: "IsRealized",
                table: "Livestock");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRealized",
                table: "Livestock",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                """
                UPDATE "Livestock" SET "IsRealized" = TRUE
                WHERE "Id" IN (
                    SELECT "LivestockId" FROM "AnimalProductions"
                    WHERE "IsRealization" AND "LivestockId" IS NOT NULL
                );
                """);
        }
    }
}
