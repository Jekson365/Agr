using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddGreenhousePositioning : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Height",
                table: "Greenhouses",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Length",
                table: "Greenhouses",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Width",
                table: "Greenhouses",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "GreenhouseFloors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseFloors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseFloors_Greenhouses_GreenhouseId",
                        column: x => x.GreenhouseId,
                        principalTable: "Greenhouses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "GreenhouseSections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GreenhouseFloorId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    X = table.Column<decimal>(type: "numeric", nullable: false),
                    Y = table.Column<decimal>(type: "numeric", nullable: false),
                    Width = table.Column<decimal>(type: "numeric", nullable: false),
                    Height = table.Column<decimal>(type: "numeric", nullable: false),
                    Rotation = table.Column<decimal>(type: "numeric", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GreenhouseSections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GreenhouseSections_GreenhouseFloors_GreenhouseFloorId",
                        column: x => x.GreenhouseFloorId,
                        principalTable: "GreenhouseFloors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseFloors_GreenhouseId",
                table: "GreenhouseFloors",
                column: "GreenhouseId");

            migrationBuilder.CreateIndex(
                name: "IX_GreenhouseSections_GreenhouseFloorId",
                table: "GreenhouseSections",
                column: "GreenhouseFloorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GreenhouseSections");

            migrationBuilder.DropTable(
                name: "GreenhouseFloors");

            migrationBuilder.DropColumn(
                name: "Height",
                table: "Greenhouses");

            migrationBuilder.DropColumn(
                name: "Length",
                table: "Greenhouses");

            migrationBuilder.DropColumn(
                name: "Width",
                table: "Greenhouses");
        }
    }
}
