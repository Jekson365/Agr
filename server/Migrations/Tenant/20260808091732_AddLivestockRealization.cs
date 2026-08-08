using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockRealization : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MeatProductionTypeId",
                table: "Livestock",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsRealization",
                table: "AnimalProductions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Livestock_MeatProductionTypeId",
                table: "Livestock",
                column: "MeatProductionTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Livestock_ProductionTypes_MeatProductionTypeId",
                table: "Livestock",
                column: "MeatProductionTypeId",
                principalTable: "ProductionTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Livestock_ProductionTypes_MeatProductionTypeId",
                table: "Livestock");

            migrationBuilder.DropIndex(
                name: "IX_Livestock_MeatProductionTypeId",
                table: "Livestock");

            migrationBuilder.DropColumn(
                name: "MeatProductionTypeId",
                table: "Livestock");

            migrationBuilder.DropColumn(
                name: "IsRealization",
                table: "AnimalProductions");
        }
    }
}
