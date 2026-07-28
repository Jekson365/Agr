using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddGreenhouseSectionStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GreenhouseSectionStocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseSectionId = table.Column<int>(type: "integer", nullable: false),
                    GreenhouseStockId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseSectionStocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseSectionStocks_GreenhouseSections_GreenhouseSectio~",
                        column: x => x.GreenhouseSectionId,
                        principalTable: "GreenhouseSections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GreenhouseSectionStocks_GreenhouseStocks_GreenhouseStockId",
                        column: x => x.GreenhouseStockId,
                        principalTable: "GreenhouseStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseSectionStocks_GreenhouseSectionId",
                table: "GreenhouseSectionStocks",
                column: "GreenhouseSectionId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseSectionStocks_GreenhouseStockId",
                table: "GreenhouseSectionStocks",
                column: "GreenhouseStockId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GreenhouseSectionStocks");
        }
    }
}
