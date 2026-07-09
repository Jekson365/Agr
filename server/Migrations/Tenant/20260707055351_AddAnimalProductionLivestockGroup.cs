using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddAnimalProductionLivestockGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "AnimalId",
                table: "AnimalProductions",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "AnimalCount",
                table: "AnimalProductions",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "LivestockId",
                table: "AnimalProductions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AnimalProductions_LivestockId",
                table: "AnimalProductions",
                column: "LivestockId");

            migrationBuilder.AddForeignKey(
                name: "FK_AnimalProductions_Livestock_LivestockId",
                table: "AnimalProductions",
                column: "LivestockId",
                principalTable: "Livestock",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AnimalProductions_Livestock_LivestockId",
                table: "AnimalProductions");

            migrationBuilder.DropIndex(
                name: "IX_AnimalProductions_LivestockId",
                table: "AnimalProductions");

            migrationBuilder.DropColumn(
                name: "AnimalCount",
                table: "AnimalProductions");

            migrationBuilder.DropColumn(
                name: "LivestockId",
                table: "AnimalProductions");

            migrationBuilder.AlterColumn<int>(
                name: "AnimalId",
                table: "AnimalProductions",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
