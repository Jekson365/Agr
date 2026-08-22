using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddPurchaseItemMovementLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MovementId",
                table: "PurchaseItems",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MovementId",
                table: "PurchaseItems");
        }
    }
}
