using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropFruitDevelopmentStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // The stage is gone from HarvestStatus, and the column stores the name — a row left
            // holding it would fail to read back. Ripening is the stage that followed it, so a
            // harvest that had got that far keeps the progress it had rather than losing it.
            migrationBuilder.Sql(
                "UPDATE \"Harvests\" SET \"Status\" = 'Ripening' WHERE \"Status\" = 'FruitDevelopment';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Which of the two stages a Ripening row came from is not recorded, so it stays put.
        }
    }
}
