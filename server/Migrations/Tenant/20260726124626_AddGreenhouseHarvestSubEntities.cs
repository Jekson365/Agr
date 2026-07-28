using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddGreenhouseHarvestSubEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GreenhouseHarvestChemicals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseHarvestId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Cost = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseHarvestChemicals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestChemicals_GreenhouseHarvests_GreenhouseHar~",
                        column: x => x.GreenhouseHarvestId,
                        principalTable: "GreenhouseHarvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GreenhouseHarvestItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseHarvestId = table.Column<int>(type: "integer", nullable: false),
                    GreenhouseStockId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseHarvestItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestItems_GreenhouseHarvests_GreenhouseHarvest~",
                        column: x => x.GreenhouseHarvestId,
                        principalTable: "GreenhouseHarvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestItems_GreenhouseStocks_GreenhouseStockId",
                        column: x => x.GreenhouseStockId,
                        principalTable: "GreenhouseStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GreenhouseHarvestResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseHarvestId = table.Column<int>(type: "integer", nullable: false),
                    GreenhouseStockId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseHarvestResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestResults_GreenhouseHarvests_GreenhouseHarve~",
                        column: x => x.GreenhouseHarvestId,
                        principalTable: "GreenhouseHarvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestResults_GreenhouseStocks_GreenhouseStockId",
                        column: x => x.GreenhouseStockId,
                        principalTable: "GreenhouseStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GreenhouseHarvestSeeds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseHarvestId = table.Column<int>(type: "integer", nullable: false),
                    GreenhouseSeedId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseHarvestSeeds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestSeeds_GreenhouseHarvests_GreenhouseHarvest~",
                        column: x => x.GreenhouseHarvestId,
                        principalTable: "GreenhouseHarvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GreenhouseHarvestSeeds_GreenhouseSeeds_GreenhouseSeedId",
                        column: x => x.GreenhouseSeedId,
                        principalTable: "GreenhouseSeeds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestChemicals_GreenhouseHarvestId",
                table: "GreenhouseHarvestChemicals",
                column: "GreenhouseHarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestItems_GreenhouseHarvestId",
                table: "GreenhouseHarvestItems",
                column: "GreenhouseHarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestItems_GreenhouseStockId",
                table: "GreenhouseHarvestItems",
                column: "GreenhouseStockId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestResults_GreenhouseHarvestId",
                table: "GreenhouseHarvestResults",
                column: "GreenhouseHarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestResults_GreenhouseStockId",
                table: "GreenhouseHarvestResults",
                column: "GreenhouseStockId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestSeeds_GreenhouseHarvestId",
                table: "GreenhouseHarvestSeeds",
                column: "GreenhouseHarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseHarvestSeeds_GreenhouseSeedId",
                table: "GreenhouseHarvestSeeds",
                column: "GreenhouseSeedId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GreenhouseHarvestChemicals");

            migrationBuilder.DropTable(
                name: "GreenhouseHarvestItems");

            migrationBuilder.DropTable(
                name: "GreenhouseHarvestResults");

            migrationBuilder.DropTable(
                name: "GreenhouseHarvestSeeds");
        }
    }
}
