using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeStockProductUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks");

            migrationBuilder.CreateIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks",
                column: "TreeProductId",
                unique: true,
                filter: "\"TreeProductId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks");

            migrationBuilder.CreateIndex(
                name: "IX_TreeStocks_TreeProductId",
                table: "TreeStocks",
                column: "TreeProductId");
        }
    }
}
