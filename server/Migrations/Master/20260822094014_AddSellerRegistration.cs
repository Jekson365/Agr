using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddSellerRegistration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSeller",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SellerName",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SellerPhone",
                table: "Users",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "SellerRegisteredAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""Users"" AS u
SET ""IsSeller"" = true,
    ""SellerName"" = u.""Name"",
    ""SellerPhone"" = u.""PhoneNumber"",
    ""SellerRegisteredAt"" = now()
WHERE EXISTS (SELECT 1 FROM ""MarketListings"" ml WHERE ml.""SellerId"" = u.""Id"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSeller",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerPhone",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SellerRegisteredAt",
                table: "Users");
        }
    }
}
