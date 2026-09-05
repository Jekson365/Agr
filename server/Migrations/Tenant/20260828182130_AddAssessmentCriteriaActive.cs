using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddAssessmentCriteriaActive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A band that already exists is one the farm uses; false here would switch every
            // standard off on the way in.
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AssessmentCriteria",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "AssessmentCriteria");
        }
    }
}
