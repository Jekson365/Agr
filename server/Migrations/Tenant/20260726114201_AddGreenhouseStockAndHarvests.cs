using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddGreenhouseStockAndHarvests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GreenhouseId",
                table: "Stocks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GreenhouseHarvests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseId = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    ExpectedHarvestDate = table.Column<DateOnly>(type: "date", nullable: true),
                    EquipmentCost = table.Column<decimal>(type: "numeric", nullable: true),
                    WorkersCost = table.Column<decimal>(type: "numeric", nullable: true),
                    FuelCost = table.Column<decimal>(type: "numeric", nullable: true),
                    OtherCost = table.Column<decimal>(type: "numeric", nullable: true),
                    Revenue = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseHarvests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvests_Greenhouses_GreenhouseId",
                        column: x => x.GreenhouseId,
                        principalTable: "Greenhouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_GreenhouseId",
                table: "Stocks",
                column: "GreenhouseId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvests_GreenhouseId",
                table: "GreenhouseHarvests",
                column: "GreenhouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_Greenhouses_GreenhouseId",
                table: "Stocks",
                column: "GreenhouseId",
                principalTable: "Greenhouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_Greenhouses_GreenhouseId",
                table: "Stocks");

            migrationBuilder.DropTable(
                name: "GreenhouseHarvests");

            migrationBuilder.DropIndex(
                name: "IX_Stocks_GreenhouseId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "GreenhouseId",
                table: "Stocks");
        }
    }
}
