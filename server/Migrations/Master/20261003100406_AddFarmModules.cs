using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddFarmModules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "AllModulesIncluded",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "FreeModule",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.Sql("UPDATE \"Users\" SET \"AllModulesIncluded\" = TRUE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllModulesIncluded",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "FreeModule",
                table: "Users");
        }
    }
}
