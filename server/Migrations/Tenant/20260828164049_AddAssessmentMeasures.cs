using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddAssessmentMeasures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A colour is not the free-text criteria it replaces, so the old column goes rather
            // than being renamed into a field that would read as a measurement.
            migrationBuilder.DropColumn(
                name: "Criteria",
                table: "HarvestAssessments");

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "HarvestAssessments",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Damaged",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Moisture",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Rotten",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SizeFrom",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SizeTo",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeightFrom",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "WeightTo",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Damaged",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "Moisture",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "Rotten",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "SizeFrom",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "SizeTo",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "WeightFrom",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "WeightTo",
                table: "HarvestAssessments");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "HarvestAssessments");

            migrationBuilder.AddColumn<string>(
                name: "Criteria",
                table: "HarvestAssessments",
                type: "text",
                nullable: false,
                defaultValue: "");
        }
    }
}
