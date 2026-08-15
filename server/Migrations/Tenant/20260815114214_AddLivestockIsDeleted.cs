using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockIsDeleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Removing a group now hides it instead of dropping the row — every production
            // collected from it, its animals and their records all cascade off it, and that history
            // is worth more than the row is. Everything already stored is still held, so existing
            // groups start out not deleted.
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Livestock",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Livestock");
        }
    }
}
