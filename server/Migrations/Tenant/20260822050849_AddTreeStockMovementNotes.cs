using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeStockMovementNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "Date",
                table: "TreeStockMovements",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "TreeStockMovements",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Date",
                table: "TreeStockMovements");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "TreeStockMovements");
        }
    }
}
