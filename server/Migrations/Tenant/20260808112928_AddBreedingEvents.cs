using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddBreedingEvents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BreedingEvents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LivestockId = table.Column<int>(type: "integer", nullable: true),
                    MaleAnimalId = table.Column<int>(type: "integer", nullable: true),
                    FemaleAnimalId = table.Column<int>(type: "integer", nullable: true),
                    BreedingDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Comment = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PregnancyConfirmedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CompletedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    FailedDate = table.Column<DateOnly>(type: "date", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BreedingEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BreedingEvents_LivestockDetails_FemaleAnimalId",
                        column: x => x.FemaleAnimalId,
                        principalTable: "LivestockDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BreedingEvents_LivestockDetails_MaleAnimalId",
                        column: x => x.MaleAnimalId,
                        principalTable: "LivestockDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_BreedingEvents_Livestock_LivestockId",
                        column: x => x.LivestockId,
                        principalTable: "Livestock",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BreedingEvents_FemaleAnimalId",
                table: "BreedingEvents",
                column: "FemaleAnimalId");

            migrationBuilder.CreateIndex(
                name: "IX_BreedingEvents_LivestockId",
                table: "BreedingEvents",
                column: "LivestockId");

            migrationBuilder.CreateIndex(
                name: "IX_BreedingEvents_MaleAnimalId",
                table: "BreedingEvents",
                column: "MaleAnimalId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BreedingEvents");
        }
    }
}
