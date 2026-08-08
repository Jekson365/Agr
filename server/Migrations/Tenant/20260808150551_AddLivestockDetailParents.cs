using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddLivestockDetailParents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentOneId",
                table: "LivestockDetails",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParentTwoId",
                table: "LivestockDetails",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LivestockDetails_ParentOneId",
                table: "LivestockDetails",
                column: "ParentOneId");

            migrationBuilder.CreateIndex(
                name: "IX_LivestockDetails_ParentTwoId",
                table: "LivestockDetails",
                column: "ParentTwoId");

            migrationBuilder.AddForeignKey(
                name: "FK_LivestockDetails_LivestockDetails_ParentOneId",
                table: "LivestockDetails",
                column: "ParentOneId",
                principalTable: "LivestockDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_LivestockDetails_LivestockDetails_ParentTwoId",
                table: "LivestockDetails",
                column: "ParentTwoId",
                principalTable: "LivestockDetails",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LivestockDetails_LivestockDetails_ParentOneId",
                table: "LivestockDetails");

            migrationBuilder.DropForeignKey(
                name: "FK_LivestockDetails_LivestockDetails_ParentTwoId",
                table: "LivestockDetails");

            migrationBuilder.DropIndex(
                name: "IX_LivestockDetails_ParentOneId",
                table: "LivestockDetails");

            migrationBuilder.DropIndex(
                name: "IX_LivestockDetails_ParentTwoId",
                table: "LivestockDetails");

            migrationBuilder.DropColumn(
                name: "ParentOneId",
                table: "LivestockDetails");

            migrationBuilder.DropColumn(
                name: "ParentTwoId",
                table: "LivestockDetails");
        }
    }
}
