using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddWineCellar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WineBatchGrapeId",
                table: "TreeProductMovements",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "WineBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Vintage = table.Column<int>(type: "integer", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    Method = table.Column<string>(type: "text", nullable: false),
                    Stage = table.Column<string>(type: "text", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineBatches", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WineBatchGrapes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    TreeProductId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineBatchGrapes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineBatchGrapes_TreeProducts_TreeProductId",
                        column: x => x.TreeProductId,
                        principalTable: "TreeProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WineBatchGrapes_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WineBottlings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    BottleSize = table.Column<decimal>(type: "numeric", nullable: false),
                    Count = table.Column<int>(type: "integer", nullable: false),
                    Lot = table.Column<string>(type: "text", nullable: true),
                    Cost = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineBottlings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineBottlings_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WineMeasurements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Sugar = table.Column<decimal>(type: "numeric", nullable: true),
                    Temperature = table.Column<decimal>(type: "numeric", nullable: true),
                    Alcohol = table.Column<decimal>(type: "numeric", nullable: true),
                    Acidity = table.Column<decimal>(type: "numeric", nullable: true),
                    Ph = table.Column<decimal>(type: "numeric", nullable: true),
                    FreeSo2 = table.Column<decimal>(type: "numeric", nullable: true),
                    TotalSo2 = table.Column<decimal>(type: "numeric", nullable: true),
                    Note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineMeasurements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineMeasurements_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WineOperations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Cost = table.Column<decimal>(type: "numeric", nullable: true),
                    LitersLost = table.Column<decimal>(type: "numeric", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineOperations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineOperations_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WineStageChanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    FromStage = table.Column<string>(type: "text", nullable: true),
                    ToStage = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineStageChanges", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineStageChanges_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WineMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WineBatchId = table.Column<int>(type: "integer", nullable: false),
                    Delta = table.Column<decimal>(type: "numeric", nullable: false),
                    BottleDelta = table.Column<int>(type: "integer", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    WineBottlingId = table.Column<int>(type: "integer", nullable: true),
                    WineOperationId = table.Column<int>(type: "integer", nullable: true),
                    MarketOrderId = table.Column<int>(type: "integer", nullable: true),
                    Revenue = table.Column<decimal>(type: "numeric", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WineMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WineMovements_WineBatches_WineBatchId",
                        column: x => x.WineBatchId,
                        principalTable: "WineBatches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WineMovements_WineBottlings_WineBottlingId",
                        column: x => x.WineBottlingId,
                        principalTable: "WineBottlings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WineMovements_WineOperations_WineOperationId",
                        column: x => x.WineOperationId,
                        principalTable: "WineOperations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TreeProductMovements_WineBatchGrapeId",
                table: "TreeProductMovements",
                column: "WineBatchGrapeId");

            migrationBuilder.CreateIndex(
                name: "IX_WineBatchGrapes_TreeProductId",
                table: "WineBatchGrapes",
                column: "TreeProductId");

            migrationBuilder.CreateIndex(
                name: "IX_WineBatchGrapes_WineBatchId",
                table: "WineBatchGrapes",
                column: "WineBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_WineBottlings_WineBatchId",
                table: "WineBottlings",
                column: "WineBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_WineMeasurements_WineBatchId",
                table: "WineMeasurements",
                column: "WineBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_WineMovements_WineBatchId",
                table: "WineMovements",
                column: "WineBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_WineMovements_WineBottlingId",
                table: "WineMovements",
                column: "WineBottlingId");

            migrationBuilder.CreateIndex(
                name: "IX_WineMovements_WineOperationId",
                table: "WineMovements",
                column: "WineOperationId");

            migrationBuilder.CreateIndex(
                name: "IX_WineOperations_WineBatchId",
                table: "WineOperations",
                column: "WineBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_WineStageChanges_WineBatchId",
                table: "WineStageChanges",
                column: "WineBatchId");

            migrationBuilder.AddForeignKey(
                name: "FK_TreeProductMovements_WineBatchGrapes_WineBatchGrapeId",
                table: "TreeProductMovements",
                column: "WineBatchGrapeId",
                principalTable: "WineBatchGrapes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TreeProductMovements_WineBatchGrapes_WineBatchGrapeId",
                table: "TreeProductMovements");

            migrationBuilder.DropTable(
                name: "WineBatchGrapes");

            migrationBuilder.DropTable(
                name: "WineMeasurements");

            migrationBuilder.DropTable(
                name: "WineMovements");

            migrationBuilder.DropTable(
                name: "WineStageChanges");

            migrationBuilder.DropTable(
                name: "WineBottlings");

            migrationBuilder.DropTable(
                name: "WineOperations");

            migrationBuilder.DropTable(
                name: "WineBatches");

            migrationBuilder.DropIndex(
                name: "IX_TreeProductMovements_WineBatchGrapeId",
                table: "TreeProductMovements");

            migrationBuilder.DropColumn(
                name: "WineBatchGrapeId",
                table: "TreeProductMovements");
        }
    }
}
