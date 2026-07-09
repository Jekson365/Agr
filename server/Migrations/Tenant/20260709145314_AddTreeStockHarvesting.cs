using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeStockHarvesting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HarvestItemId",
                table: "TreeStockMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HarvestResultId",
                table: "TreeStockMovements",
                type: "integer",
                nullable: true);

            // Every TreeStockMovement row that exists before this migration was logged before
            // harvest-linkage existed on tree stock, so it's inherently a manual edit.
            migrationBuilder.AddColumn<string>(
                name: "Source",
                table: "TreeStockMovements",
                type: "text",
                nullable: false,
                defaultValue: "Manual");

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "HarvestResults",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "TreeStockId",
                table: "HarvestResults",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "HarvestItems",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "TreeStockId",
                table: "HarvestItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TreeStockMovements_HarvestItemId",
                table: "TreeStockMovements",
                column: "HarvestItemId");

            migrationBuilder.CreateIndex(
                name: "IX_TreeStockMovements_HarvestResultId",
                table: "TreeStockMovements",
                column: "HarvestResultId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestResults_TreeStockId",
                table: "HarvestResults",
                column: "TreeStockId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestItems_TreeStockId",
                table: "HarvestItems",
                column: "TreeStockId");

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestItems_TreeStocks_TreeStockId",
                table: "HarvestItems",
                column: "TreeStockId",
                principalTable: "TreeStocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestResults_TreeStocks_TreeStockId",
                table: "HarvestResults",
                column: "TreeStockId",
                principalTable: "TreeStocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TreeStockMovements_HarvestItems_HarvestItemId",
                table: "TreeStockMovements",
                column: "HarvestItemId",
                principalTable: "HarvestItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TreeStockMovements_HarvestResults_HarvestResultId",
                table: "TreeStockMovements",
                column: "HarvestResultId",
                principalTable: "HarvestResults",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HarvestItems_TreeStocks_TreeStockId",
                table: "HarvestItems");

            migrationBuilder.DropForeignKey(
                name: "FK_HarvestResults_TreeStocks_TreeStockId",
                table: "HarvestResults");

            migrationBuilder.DropForeignKey(
                name: "FK_TreeStockMovements_HarvestItems_HarvestItemId",
                table: "TreeStockMovements");

            migrationBuilder.DropForeignKey(
                name: "FK_TreeStockMovements_HarvestResults_HarvestResultId",
                table: "TreeStockMovements");

            migrationBuilder.DropIndex(
                name: "IX_TreeStockMovements_HarvestItemId",
                table: "TreeStockMovements");

            migrationBuilder.DropIndex(
                name: "IX_TreeStockMovements_HarvestResultId",
                table: "TreeStockMovements");

            migrationBuilder.DropIndex(
                name: "IX_HarvestResults_TreeStockId",
                table: "HarvestResults");

            migrationBuilder.DropIndex(
                name: "IX_HarvestItems_TreeStockId",
                table: "HarvestItems");

            migrationBuilder.DropColumn(
                name: "HarvestItemId",
                table: "TreeStockMovements");

            migrationBuilder.DropColumn(
                name: "HarvestResultId",
                table: "TreeStockMovements");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "TreeStockMovements");

            migrationBuilder.DropColumn(
                name: "TreeStockId",
                table: "HarvestResults");

            migrationBuilder.DropColumn(
                name: "TreeStockId",
                table: "HarvestItems");

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "HarvestResults",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "HarvestItems",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
