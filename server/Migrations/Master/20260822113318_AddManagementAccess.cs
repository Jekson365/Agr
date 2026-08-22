using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddManagementAccess : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasManagementAccess",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasManagementAccess",
                table: "Users");
        }
    }
}
