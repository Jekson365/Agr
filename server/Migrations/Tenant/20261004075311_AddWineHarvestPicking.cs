using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddWineHarvestPicking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "TreeStockId",
                table: "HarvestTrees",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "StockId",
                table: "HarvestTrees",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HarvestTrees_StockId",
                table: "HarvestTrees",
                column: "StockId");

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestTrees_Stocks_StockId",
                table: "HarvestTrees",
                column: "StockId",
                principalTable: "Stocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HarvestTrees_Stocks_StockId",
                table: "HarvestTrees");

            migrationBuilder.DropIndex(
                name: "IX_HarvestTrees_StockId",
                table: "HarvestTrees");

            migrationBuilder.DropColumn(
                name: "StockId",
                table: "HarvestTrees");

            migrationBuilder.AlterColumn<int>(
                name: "TreeStockId",
                table: "HarvestTrees",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
