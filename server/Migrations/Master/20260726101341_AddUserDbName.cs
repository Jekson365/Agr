using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddUserDbName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DbName",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            // Existing accounts already have a database, named after their id — record the name
            // they were provisioned under rather than leaving the column blank behind them.
            migrationBuilder.Sql("""UPDATE "Users" SET "DbName" = 'farm_user_' || "Id" WHERE "DbName" = '';""");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DbName",
                table: "Users");
        }
    }
}
