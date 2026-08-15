using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeStockIsDeleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Removing a fruit now hides it instead of dropping the row — its movement log, the
            // harvest rows recording these trees as picked and its land plot all cascade off it,
            // and that history is worth more than the row is. Everything already stored is still
            // held, so existing fruit starts out not deleted.
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "TreeStocks",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "TreeStocks");
        }
    }
}
