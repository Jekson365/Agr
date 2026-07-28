using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestFarmId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "Harvests",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Harvests_FarmId",
                table: "Harvests",
                column: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Harvests_Farms_FarmId",
                table: "Harvests",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Harvests_Farms_FarmId",
                table: "Harvests");

            migrationBuilder.DropIndex(
                name: "IX_Harvests_FarmId",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "Harvests");
        }
    }
}
