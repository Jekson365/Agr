using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class ReplaceMarketListingImagePathWithImagePaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "MarketListings");

            migrationBuilder.AddColumn<List<string>>(
                name: "ImagePaths",
                table: "MarketListings",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePaths",
                table: "MarketListings");

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "MarketListings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
