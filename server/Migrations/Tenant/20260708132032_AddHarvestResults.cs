using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestResults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "HarvestResultId",
                table: "StockMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "HarvestResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HarvestId = table.Column<int>(type: "integer", nullable: false),
                    StockId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HarvestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HarvestResults_Harvests_HarvestId",
                        column: x => x.HarvestId,
                        principalTable: "Harvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HarvestResults_Stocks_StockId",
                        column: x => x.StockId,
                        principalTable: "Stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockMovements_HarvestResultId",
                table: "StockMovements",
                column: "HarvestResultId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestResults_HarvestId",
                table: "HarvestResults",
                column: "HarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestResults_StockId",
                table: "HarvestResults",
                column: "StockId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_HarvestResults_HarvestResultId",
                table: "StockMovements",
                column: "HarvestResultId",
                principalTable: "HarvestResults",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_HarvestResults_HarvestResultId",
                table: "StockMovements");

            migrationBuilder.DropTable(
                name: "HarvestResults");

            migrationBuilder.DropIndex(
                name: "IX_StockMovements_HarvestResultId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "HarvestResultId",
                table: "StockMovements");
        }
    }
}
