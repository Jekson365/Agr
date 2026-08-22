using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockProduces : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LivestockProduces",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LivestockId = table.Column<int>(type: "integer", nullable: false),
                    ProductionTypeId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LivestockProduces", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LivestockProduces_Livestock_LivestockId",
                        column: x => x.LivestockId,
                        principalTable: "Livestock",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LivestockProduces_ProductionTypes_ProductionTypeId",
                        column: x => x.ProductionTypeId,
                        principalTable: "ProductionTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LivestockProduces_LivestockId_ProductionTypeId",
                table: "LivestockProduces",
                columns: new[] { "LivestockId", "ProductionTypeId" },
                unique: true);

            migrationBuilder.Sql(
                """
                INSERT INTO "LivestockProduces" ("LivestockId", "ProductionTypeId")
                SELECT "Id", "ProductionTypeId" FROM "Livestock" WHERE "ProductionTypeId" IS NOT NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_LivestockProduces_ProductionTypeId",
                table: "LivestockProduces",
                column: "ProductionTypeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LivestockProduces");
        }
    }
}
