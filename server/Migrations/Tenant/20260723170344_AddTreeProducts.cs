using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TreeProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TreeStockId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreeProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreeProducts_TreeStocks_TreeStockId",
                        column: x => x.TreeStockId,
                        principalTable: "TreeStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "HarvestProducts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HarvestId = table.Column<int>(type: "integer", nullable: false),
                    TreeProductId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HarvestProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HarvestProducts_Harvests_HarvestId",
                        column: x => x.HarvestId,
                        principalTable: "Harvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HarvestProducts_TreeProducts_TreeProductId",
                        column: x => x.TreeProductId,
                        principalTable: "TreeProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HarvestProducts_HarvestId",
                table: "HarvestProducts",
                column: "HarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestProducts_TreeProductId",
                table: "HarvestProducts",
                column: "TreeProductId");

            migrationBuilder.CreateIndex(
                name: "IX_TreeProducts_TreeStockId",
                table: "TreeProducts",
                column: "TreeStockId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HarvestProducts");

            migrationBuilder.DropTable(
                name: "TreeProducts");
        }
    }
}
