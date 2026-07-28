using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddHarvestKind : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // EF's generated default was an empty string, which is not a valid HarvestKind and
            // would make every existing harvest fail to read back. Existing rows are all crop
            // harvests, so they are backfilled as such.
            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "Harvests",
                type: "text",
                nullable: false,
                defaultValue: "Crop");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Harvests");
        }
    }
}
