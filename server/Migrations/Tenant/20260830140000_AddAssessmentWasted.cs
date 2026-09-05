using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddAssessmentWasted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Waste is recorded per band now rather than as a band of its own, so the rows that
            // carried it go — the column below is where that figure lives from here.
            migrationBuilder.Sql("DELETE FROM \"HarvestAssessments\" WHERE \"Grade\" = 'Waste';");

            migrationBuilder.AddColumn<decimal>(
                name: "Wasted",
                table: "HarvestAssessments",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Wasted",
                table: "HarvestAssessments");
        }
    }
}
