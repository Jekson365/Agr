using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockAnimalSales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MarketOrderId",
                table: "LivestockMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MarketOrderId",
                table: "LivestockDetails",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "SoldOn",
                table: "LivestockDetails",
                type: "date",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MarketOrderId",
                table: "LivestockMovements");

            migrationBuilder.DropColumn(
                name: "MarketOrderId",
                table: "LivestockDetails");

            migrationBuilder.DropColumn(
                name: "SoldOn",
                table: "LivestockDetails");
        }
    }
}
