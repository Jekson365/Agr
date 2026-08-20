using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddListingSource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SourceId",
                table: "MarketOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceKind",
                table: "MarketOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourceUnitId",
                table: "MarketOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourceId",
                table: "MarketListings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SourceKind",
                table: "MarketListings",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourceUnitId",
                table: "MarketListings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "SourceKind",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "SourceUnitId",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "SourceId",
                table: "MarketListings");

            migrationBuilder.DropColumn(
                name: "SourceKind",
                table: "MarketListings");

            migrationBuilder.DropColumn(
                name: "SourceUnitId",
                table: "MarketListings");
        }
    }
}
