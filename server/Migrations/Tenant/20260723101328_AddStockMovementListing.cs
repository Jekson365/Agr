using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddStockMovementListing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MarketListingId",
                table: "TreeStockMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MarketListingId",
                table: "StockMovements",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MarketListingId",
                table: "TreeStockMovements");

            migrationBuilder.DropColumn(
                name: "MarketListingId",
                table: "StockMovements");
        }
    }
}
