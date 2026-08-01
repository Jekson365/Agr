using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockProductionType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductionTypeId",
                table: "Livestock",
                type: "integer",
                nullable: true);

            // What a group produces is now declared on the group, but its existing records were
            // each collected under a type of their own. Take the one they were mostly collected
            // under (the latest breaks a tie) as what the group produces, so a group already
            // collecting carries on rather than having to declare it before its next record.
            // A group that has collected nothing is left null — there is nothing to infer from.
            migrationBuilder.Sql(@"
UPDATE ""Livestock"" AS l
SET ""ProductionTypeId"" = mostUsed.""ProductionTypeId""
FROM (
    SELECT DISTINCT ON (owner_id) owner_id, ""ProductionTypeId""
    FROM (
        SELECT owner_id, ""ProductionTypeId"", COUNT(*) AS uses, MAX(""Id"") AS latest
        FROM (
            SELECT ap.""LivestockId"" AS owner_id, ap.""ProductionTypeId"", ap.""Id""
            FROM ""AnimalProductions"" ap
            WHERE ap.""LivestockId"" IS NOT NULL
            UNION ALL
            SELECT ld.""LivestockId"" AS owner_id, ap.""ProductionTypeId"", ap.""Id""
            FROM ""AnimalProductions"" ap
            JOIN ""LivestockDetails"" ld ON ld.""Id"" = ap.""AnimalId""
        ) AS collected
        GROUP BY owner_id, ""ProductionTypeId""
    ) AS tally
    ORDER BY owner_id, uses DESC, latest DESC
) AS mostUsed
WHERE l.""Id"" = mostUsed.owner_id;");

            migrationBuilder.CreateIndex(
                name: "IX_Livestock_ProductionTypeId",
                table: "Livestock",
                column: "ProductionTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Livestock_ProductionTypes_ProductionTypeId",
                table: "Livestock",
                column: "ProductionTypeId",
                principalTable: "ProductionTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Livestock_ProductionTypes_ProductionTypeId",
                table: "Livestock");

            migrationBuilder.DropIndex(
                name: "IX_Livestock_ProductionTypeId",
                table: "Livestock");

            migrationBuilder.DropColumn(
                name: "ProductionTypeId",
                table: "Livestock");
        }
    }
}
