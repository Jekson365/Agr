using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddFeedFruitAndEquipment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "StockFeeds",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "EquipmentId",
                table: "StockFeeds",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TreeProductId",
                table: "StockFeeds",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockFeeds_EquipmentId",
                table: "StockFeeds",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_StockFeeds_TreeProductId",
                table: "StockFeeds",
                column: "TreeProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockFeeds_Equipment_EquipmentId",
                table: "StockFeeds",
                column: "EquipmentId",
                principalTable: "Equipment",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StockFeeds_TreeProducts_TreeProductId",
                table: "StockFeeds",
                column: "TreeProductId",
                principalTable: "TreeProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockFeeds_Equipment_EquipmentId",
                table: "StockFeeds");

            migrationBuilder.DropForeignKey(
                name: "FK_StockFeeds_TreeProducts_TreeProductId",
                table: "StockFeeds");

            migrationBuilder.DropIndex(
                name: "IX_StockFeeds_EquipmentId",
                table: "StockFeeds");

            migrationBuilder.DropIndex(
                name: "IX_StockFeeds_TreeProductId",
                table: "StockFeeds");

            migrationBuilder.DropColumn(
                name: "EquipmentId",
                table: "StockFeeds");

            migrationBuilder.DropColumn(
                name: "TreeProductId",
                table: "StockFeeds");

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "StockFeeds",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
