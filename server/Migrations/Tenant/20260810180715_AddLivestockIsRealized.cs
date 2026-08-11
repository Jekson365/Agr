using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockIsRealized : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRealized",
                table: "Livestock",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // False is right for a group that was never realized, but a group already carrying a
            // realization record was realized before the mark existed — the record is the truth
            // the column is derived from either way, so it is asked here rather than left to say
            // that every herd on the farm is unrealized.
            migrationBuilder.Sql(
                """
                UPDATE "Livestock" SET "IsRealized" = TRUE
                WHERE "Id" IN (
                    SELECT "LivestockId" FROM "AnimalProductions"
                    WHERE "IsRealization" AND "LivestockId" IS NOT NULL
                );
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRealized",
                table: "Livestock");
        }
    }
}
