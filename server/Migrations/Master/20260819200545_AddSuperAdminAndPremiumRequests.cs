using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddSuperAdminAndPremiumRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSuperAdmin",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PremiumGrantedAt",
                table: "MarketListings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PremiumRequestedAt",
                table: "MarketListings",
                type: "timestamp with time zone",
                nullable: true);

            // The platform's first operator. Done here rather than by hand so a freshly migrated
            // database always has exactly one account that can open the manager page -- a system
            // with an operator page and no operator is a locked door with no key.
            // Lower-cased: the auth layer stores emails lower-case, so this matches what is there.
            migrationBuilder.Sql(
                "UPDATE \"Users\" SET \"IsSuperAdmin\" = true WHERE lower(\"Email\") = 'jeko.erg@gmail.com';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsSuperAdmin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PremiumGrantedAt",
                table: "MarketListings");

            migrationBuilder.DropColumn(
                name: "PremiumRequestedAt",
                table: "MarketListings");
        }
    }
}
