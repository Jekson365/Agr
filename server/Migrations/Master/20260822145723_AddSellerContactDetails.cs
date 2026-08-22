using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddSellerContactDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SellerFacebook",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SellerLocation",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SellerTelegram",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SellerWhatsapp",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SellerFacebook",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerLocation",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerTelegram",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerWhatsapp",
                table: "Users");
        }
    }
}
