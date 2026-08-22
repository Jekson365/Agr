using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddManualBalanceAdjustments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "TreeProductMovements",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "TreeProductMovements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "StockMovements",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "StockMovements",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "ProductionMovements",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "ProductionMovements",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GreenhouseStockMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseStockId = table.Column<int>(type: "integer", nullable: false),
                    Delta = table.Column<decimal>(type: "numeric", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseStockMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseStockMovements_GreenhouseStocks_GreenhouseStockId",
                        column: x => x.GreenhouseStockId,
                        principalTable: "GreenhouseStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseStockMovements_GreenhouseStockId",
                table: "GreenhouseStockMovements",
                column: "GreenhouseStockId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GreenhouseStockMovements");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "TreeProductMovements");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "TreeProductMovements");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "ProductionMovements");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "ProductionMovements");
        }
    }
}
