using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class ReworkTreeProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HarvestProducts_TreeProducts_TreeProductId",
                table: "HarvestProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_TreeProducts_TreeStocks_TreeStockId",
                table: "TreeProducts");

            migrationBuilder.DropIndex(
                name: "IX_TreeProducts_TreeStockId",
                table: "TreeProducts");

            migrationBuilder.DropColumn(
                name: "TreeStockId",
                table: "TreeProducts");

            migrationBuilder.AddColumn<int>(
                name: "TreeProductId",
                table: "TreeStocks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks",
                column: "TreeProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestProducts_TreeProducts_TreeProductId",
                table: "HarvestProducts",
                column: "TreeProductId",
                principalTable: "TreeProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TreeStocks_TreeProducts_TreeProductId",
                table: "TreeStocks",
                column: "TreeProductId",
                principalTable: "TreeProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HarvestProducts_TreeProducts_TreeProductId",
                table: "HarvestProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_TreeStocks_TreeProducts_TreeProductId",
                table: "TreeStocks");

            migrationBuilder.DropIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks");

            migrationBuilder.DropColumn(
                name: "TreeProductId",
                table: "TreeStocks");

            migrationBuilder.AddColumn<int>(
                name: "TreeStockId",
                table: "TreeProducts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_TreeProducts_TreeStockId",
                table: "TreeProducts",
                column: "TreeStockId");

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestProducts_TreeProducts_TreeProductId",
                table: "HarvestProducts",
                column: "TreeProductId",
                principalTable: "TreeProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TreeProducts_TreeStocks_TreeStockId",
                table: "TreeProducts",
                column: "TreeStockId",
                principalTable: "TreeStocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
