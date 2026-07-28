using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddTreeProductMovements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TreeProductMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TreeProductId = table.Column<int>(type: "integer", nullable: false),
                    HarvestProductId = table.Column<int>(type: "integer", nullable: true),
                    Delta = table.Column<decimal>(type: "numeric", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TreeProductMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TreeProductMovements_HarvestProducts_HarvestProductId",
                        column: x => x.HarvestProductId,
                        principalTable: "HarvestProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TreeProductMovements_TreeProducts_TreeProductId",
                        column: x => x.TreeProductId,
                        principalTable: "TreeProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreeProductMovements_HarvestProductId",
                table: "TreeProductMovements",
                column: "HarvestProductId");

            migrationBuilder.CreateIndex(
                name: "IX_TreeProductMovements_TreeProductId",
                table: "TreeProductMovements",
                column: "TreeProductId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TreeProductMovements");
        }
    }
}
