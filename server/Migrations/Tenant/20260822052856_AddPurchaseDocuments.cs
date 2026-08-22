using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddPurchaseDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PurchaseDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Seller = table.Column<string>(type: "text", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Note = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PurchaseDocumentId = table.Column<int>(type: "integer", nullable: false),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    TargetId = table.Column<int>(type: "integer", nullable: false),
                    UnitId = table.Column<int>(type: "integer", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric", nullable: false),
                    Price = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseItems_PurchaseDocuments_PurchaseDocumentId",
                        column: x => x.PurchaseDocumentId,
                        principalTable: "PurchaseDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseItems_PurchaseDocumentId",
                table: "PurchaseItems",
                column: "PurchaseDocumentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PurchaseItems");

            migrationBuilder.DropTable(
                name: "PurchaseDocuments");
        }
    }
}
