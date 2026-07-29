using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLandPlotTreeStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TreeStockId",
                table: "LandPlots",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LandPlots_TreeStockId",
                table: "LandPlots",
                column: "TreeStockId");

            migrationBuilder.AddForeignKey(
                name: "FK_LandPlots_TreeStocks_TreeStockId",
                table: "LandPlots",
                column: "TreeStockId",
                principalTable: "TreeStocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LandPlots_TreeStocks_TreeStockId",
                table: "LandPlots");

            migrationBuilder.DropIndex(
                name: "IX_LandPlots_TreeStockId",
                table: "LandPlots");

            migrationBuilder.DropColumn(
                name: "TreeStockId",
                table: "LandPlots");
        }
    }
}
