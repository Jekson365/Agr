using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddSoilParameterAvailableUnit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DefaultUnitAvailable",
                table: "SoilParameterDefinitions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 1,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 2,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 3,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 4,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 5,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 6,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 7,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 8,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 9,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 10,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 11,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 12,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 13,
                columns: new[] { "DefaultUnit", "DefaultUnitAvailable" },
                values: new object[] { "%", "mg/kg" });

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 14,
                columns: new[] { "DefaultUnit", "DefaultUnitAvailable" },
                values: new object[] { "%", "mg/kg" });

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 15,
                columns: new[] { "DefaultUnit", "DefaultUnitAvailable" },
                values: new object[] { "%", "mg/kg" });

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 16,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 17,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 18,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 19,
                column: "DefaultUnitAvailable",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 20,
                column: "DefaultUnitAvailable",
                value: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultUnitAvailable",
                table: "SoilParameterDefinitions");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 13,
                column: "DefaultUnit",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 14,
                column: "DefaultUnit",
                value: "");

            migrationBuilder.UpdateData(
                table: "SoilParameterDefinitions",
                keyColumn: "Id",
                keyValue: 15,
                column: "DefaultUnit",
                value: "");
        }
    }
}
