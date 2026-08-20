using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddMarketOrderBuyerDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BuyerAddress",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BuyerCity",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BuyerFacebookUrl",
                table: "MarketOrders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuyerSurname",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BuyerVillage",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Fulfillment",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "Ordered");

            migrationBuilder.AddColumn<string>(
                name: "ItemCategory",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "Other");

            migrationBuilder.AddColumn<string>(
                name: "ItemTitle",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ItemType",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PriceUnit",
                table: "MarketOrders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SellerId",
                table: "MarketOrders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("""
                UPDATE "MarketOrders" AS o
                SET "SellerId" = l."SellerId",
                    "ItemTitle" = l."Title",
                    "ItemType" = l."ItemType",
                    "ItemCategory" = l."Category",
                    "PriceUnit" = l."PriceUnit"
                FROM "MarketListings" AS l
                WHERE l."Id" = o."ListingId";
                """);

            migrationBuilder.Sql("""
                UPDATE "MarketOrders"
                SET "ItemCategory" = 'Other'
                WHERE "ItemCategory" = '';
                """);

            migrationBuilder.Sql("""
                UPDATE "MarketOrders"
                SET "Fulfillment" = 'Ordered'
                WHERE "Fulfillment" = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_MarketOrders_SellerId",
                table: "MarketOrders",
                column: "SellerId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MarketOrders_SellerId",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "BuyerAddress",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "BuyerCity",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "BuyerFacebookUrl",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "BuyerSurname",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "BuyerVillage",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "Fulfillment",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "ItemCategory",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "ItemTitle",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "ItemType",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "PriceUnit",
                table: "MarketOrders");

            migrationBuilder.DropColumn(
                name: "SellerId",
                table: "MarketOrders");
        }
    }
}
