using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class HarvestItemReferencesStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add StockId nullable first so we can backfill it from the old Type column below,
            // before Type/Unit are dropped and the column is locked down to NOT NULL.
            migrationBuilder.AddColumn<int>(
                name: "StockId",
                table: "HarvestItems",
                type: "integer",
                nullable: true);

            // Best-effort backfill: point each item at the lowest-id Stock that shares its old
            // Type. This reproduces the exact bucket the old type-keyed AdjustAmountAsync used to
            // credit, since it also picked the first matching Stock with no explicit ordering.
            migrationBuilder.Sql(
                "UPDATE \"HarvestItems\" hi SET \"StockId\" = (" +
                "SELECT MIN(s.\"Id\") FROM \"Stocks\" s WHERE s.\"Type\" = hi.\"Type\");");

            // Drop any item that couldn't be matched to an existing stock (its Type no longer
            // has a corresponding Stock row) — there's no bucket left for it to reference.
            migrationBuilder.Sql("DELETE FROM \"HarvestItems\" WHERE \"StockId\" IS NULL;");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "HarvestItems");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "HarvestItems");

            migrationBuilder.AlterColumn<int>(
                name: "StockId",
                table: "HarvestItems",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_HarvestItems_StockId",
                table: "HarvestItems",
                column: "StockId");

            migrationBuilder.AddForeignKey(
                name: "FK_HarvestItems_Stocks_StockId",
                table: "HarvestItems",
                column: "StockId",
                principalTable: "Stocks",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_HarvestItems_Stocks_StockId",
                table: "HarvestItems");

            migrationBuilder.DropIndex(
                name: "IX_HarvestItems_StockId",
                table: "HarvestItems");

            migrationBuilder.DropColumn(
                name: "StockId",
                table: "HarvestItems");

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "HarvestItems",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "HarvestItems",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
