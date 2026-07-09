using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class LinkStockMovementToHarvestItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HarvestItemId",
                table: "StockMovements",
                type: "integer",
                nullable: true);

            // Best-effort backfill: link each existing Harvest-sourced movement to the harvest
            // item that produced it, matching on stock + amount (the only correlation available
            // for movements logged before this link existed). Ambiguous or unmatched rows are
            // left unlinked — a later edit to that item will log a fresh linked movement instead.
            migrationBuilder.Sql(
                "UPDATE \"StockMovements\" sm SET \"HarvestItemId\" = (" +
                "SELECT hi.\"Id\" FROM \"HarvestItems\" hi " +
                "WHERE hi.\"StockId\" = sm.\"StockId\" AND hi.\"Amount\" = sm.\"Delta\" LIMIT 1) " +
                "WHERE sm.\"Source\" = 'Harvest' AND sm.\"HarvestItemId\" IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_HarvestItemId",
                table: "StockMovements",
                column: "HarvestItemId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_HarvestItems_HarvestItemId",
                table: "StockMovements",
                column: "HarvestItemId",
                principalTable: "HarvestItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_HarvestItems_HarvestItemId",
                table: "StockMovements");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_HarvestItemId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "HarvestItemId",
                table: "StockMovements");
        }
    }
}
