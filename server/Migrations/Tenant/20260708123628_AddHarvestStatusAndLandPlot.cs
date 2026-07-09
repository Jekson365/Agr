using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestStatusAndLandPlot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LandPlotId",
                table: "Harvests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Harvests",
                type: "text",
                nullable: false,
                defaultValue: "Planning");

            migrationBuilder.CreateIndex(
                name: "IX_Harvests_LandPlotId",
                table: "Harvests",
                column: "LandPlotId");

            migrationBuilder.AddForeignKey(
                name: "FK_Harvests_LandPlots_LandPlotId",
                table: "Harvests",
                column: "LandPlotId",
                principalTable: "LandPlots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Harvests_LandPlots_LandPlotId",
                table: "Harvests");

            migrationBuilder.DropIndex(
                name: "IX_Harvests_LandPlotId",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "LandPlotId",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Harvests");
        }
    }
}
