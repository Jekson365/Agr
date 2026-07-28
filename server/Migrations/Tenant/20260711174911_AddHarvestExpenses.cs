using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestExpenses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EquipmentCost",
                table: "Harvests",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FuelCost",
                table: "Harvests",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OtherCost",
                table: "Harvests",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WorkersCost",
                table: "Harvests",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EquipmentCost",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "FuelCost",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "OtherCost",
                table: "Harvests");

            migrationBuilder.DropColumn(
                name: "WorkersCost",
                table: "Harvests");
        }
    }
}
