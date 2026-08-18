using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddKindImagePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "StockKinds",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "LivestockKinds",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "FruitKinds",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "FruitKinds",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 4,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 5,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 6,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 7,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 8,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 9,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "LivestockKinds",
                keyColumn: "Id",
                keyValue: 10,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 1,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 2,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 3,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 4,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 5,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 6,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 7,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 8,
                column: "ImagePath",
                value: "");

            migrationBuilder.UpdateData(
                table: "StockKinds",
                keyColumn: "Id",
                keyValue: 9,
                column: "ImagePath",
                value: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "StockKinds");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "LivestockKinds");

            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "FruitKinds");
        }
    }
}
