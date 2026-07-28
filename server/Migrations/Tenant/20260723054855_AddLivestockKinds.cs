using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockKinds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LivestockKinds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LivestockKinds", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "LivestockKinds",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Cow" },
                    { 2, "Sheep" },
                    { 3, "Chicken" },
                    { 4, "Turkey" },
                    { 5, "Pig" },
                    { 6, "Cat" },
                    { 7, "Dog" },
                    { 8, "Duck" },
                    { 9, "Goat" },
                    { 10, "Rabbit" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_LivestockKinds_Name",
                table: "LivestockKinds",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LivestockKinds");
        }
    }
}
