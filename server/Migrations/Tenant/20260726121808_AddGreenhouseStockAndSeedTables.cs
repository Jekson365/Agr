using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddGreenhouseStockAndSeedTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_Greenhouses_GreenhouseId",
                table: "Stocks");

            migrationBuilder.DropIndex(
                name: "IX_Stocks_GreenhouseId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "GreenhouseId",
                table: "Stocks");

            migrationBuilder.CreateTable(
                name: "GreenhouseSeeds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseSeeds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseSeeds_Greenhouses_GreenhouseId",
                        column: x => x.GreenhouseId,
                        principalTable: "Greenhouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GreenhouseStocks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseStocks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseStocks_Greenhouses_GreenhouseId",
                        column: x => x.GreenhouseId,
                        principalTable: "Greenhouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseSeeds_GreenhouseId",
                table: "GreenhouseSeeds",
                column: "GreenhouseId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseStocks_GreenhouseId",
                table: "GreenhouseStocks",
                column: "GreenhouseId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GreenhouseSeeds");

            migrationBuilder.DropTable(
                name: "GreenhouseStocks");

            migrationBuilder.AddColumn<int>(
                name: "GreenhouseId",
                table: "Stocks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_GreenhouseId",
                table: "Stocks",
                column: "GreenhouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_Greenhouses_GreenhouseId",
                table: "Stocks",
                column: "GreenhouseId",
                principalTable: "Greenhouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
