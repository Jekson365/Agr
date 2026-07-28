using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddSeeds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Seeds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Seeds", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HarvestSeeds",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    HarvestId = table.Column<int>(type: "integer", nullable: false),
                    SeedId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HarvestSeeds", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HarvestSeeds_Harvests_HarvestId",
                        column: x => x.HarvestId,
                        principalTable: "Harvests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_HarvestSeeds_Seeds_SeedId",
                        column: x => x.SeedId,
                        principalTable: "Seeds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SeedMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SeedId = table.Column<int>(type: "integer", nullable: false),
                    HarvestSeedId = table.Column<int>(type: "integer", nullable: true),
                    Delta = table.Column<decimal>(type: "numeric", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SeedMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SeedMovements_HarvestSeeds_HarvestSeedId",
                        column: x => x.HarvestSeedId,
                        principalTable: "HarvestSeeds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SeedMovements_Seeds_SeedId",
                        column: x => x.SeedId,
                        principalTable: "Seeds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_HarvestSeeds_HarvestId",
                table: "HarvestSeeds",
                column: "HarvestId");

            migrationBuilder.CreateIndex(
                name: "IX_HarvestSeeds_SeedId",
                table: "HarvestSeeds",
                column: "SeedId");

            migrationBuilder.CreateIndex(
                name: "IX_SeedMovements_HarvestSeedId",
                table: "SeedMovements",
                column: "HarvestSeedId");

            migrationBuilder.CreateIndex(
                name: "IX_SeedMovements_SeedId",
                table: "SeedMovements",
                column: "SeedId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SeedMovements");

            migrationBuilder.DropTable(
                name: "HarvestSeeds");

            migrationBuilder.DropTable(
                name: "Seeds");
        }
    }
}
