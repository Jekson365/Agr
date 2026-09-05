using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class MoveAssessmentCriteriaToGood : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Color",
                table: "HarvestAssessments");

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

            migrationBuilder.CreateTable(
                name: "AssessmentCriteria",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StockId = table.Column<int>(type: "integer", nullable: true),
                    TreeStockId = table.Column<int>(type: "integer", nullable: true),
                    Grade = table.Column<string>(type: "text", nullable: false),
                    SizeFrom = table.Column<decimal>(type: "numeric", nullable: true),
                    SizeTo = table.Column<decimal>(type: "numeric", nullable: true),
                    WeightFrom = table.Column<decimal>(type: "numeric", nullable: true),
                    WeightTo = table.Column<decimal>(type: "numeric", nullable: true),
                    Damaged = table.Column<decimal>(type: "numeric", nullable: true),
                    Rotten = table.Column<decimal>(type: "numeric", nullable: true),
                    Moisture = table.Column<decimal>(type: "numeric", nullable: true),
                    Color = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssessmentCriteria", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssessmentCriteria_Stocks_StockId",
                        column: x => x.StockId,
                        principalTable: "Stocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssessmentCriteria_TreeStocks_TreeStockId",
                        column: x => x.TreeStockId,
                        principalTable: "TreeStocks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentCriteria_StockId",
                table: "AssessmentCriteria",
                column: "StockId");

            migrationBuilder.CreateIndex(
                name: "IX_AssessmentCriteria_TreeStockId",
                table: "AssessmentCriteria",
                column: "TreeStockId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssessmentCriteria");

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
    }
}
