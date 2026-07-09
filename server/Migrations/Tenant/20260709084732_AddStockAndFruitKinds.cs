using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddStockAndFruitKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FruitKinds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FruitKinds", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "StockKinds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StockKinds", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "FruitKinds",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Apple" },
                    { 2, "Orange" },
                    { 3, "Banana" }
                });

            migrationBuilder.InsertData(
                table: "StockKinds",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Weat" },
                    { 2, "Beans" },
                    { 3, "Milk" },
                    { 4, "Cabbage" },
                    { 5, "Cucumber" },
                    { 6, "Eggplant" },
                    { 7, "Potato" },
                    { 8, "Pumpkin" },
                    { 9, "Tomato" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_FruitKinds_Name",
                table: "FruitKinds",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockKinds_Name",
                table: "StockKinds",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FruitKinds");

            migrationBuilder.DropTable(
                name: "StockKinds");
        }
    }
}
