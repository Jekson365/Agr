using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeSeedlings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TreeSeedlings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    SownDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ExpectedReadyDate = table.Column<DateOnly>(type: "date", nullable: true),
                    SproutedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    HardeningDate = table.Column<DateOnly>(type: "date", nullable: true),
                    ReadyDate = table.Column<DateOnly>(type: "date", nullable: true),
                    PlantedOutDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    TreeStockId = table.Column<int>(type: "integer", nullable: true),
                    PlantedOutQuantity = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreeSeedlings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreeSeedlings_TreeStocks_TreeStockId",
                        column: x => x.TreeStockId,
                        principalTable: "TreeStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreeSeedlings_TreeStockId",
                table: "TreeSeedlings",
                column: "TreeStockId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TreeSeedlings");
        }
    }
}
