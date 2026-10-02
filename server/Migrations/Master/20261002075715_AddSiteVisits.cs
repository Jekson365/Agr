using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class AddSiteVisits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SiteVisits",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VisitorId = table.Column<string>(type: "text", nullable: false),
                    SessionId = table.Column<string>(type: "text", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: true),
                    Path = table.Column<string>(type: "text", nullable: false),
                    Referrer = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    UtmSource = table.Column<string>(type: "text", nullable: false),
                    UtmMedium = table.Column<string>(type: "text", nullable: false),
                    UtmCampaign = table.Column<string>(type: "text", nullable: false),
                    Ip = table.Column<string>(type: "text", nullable: false),
                    CountryCode = table.Column<string>(type: "text", nullable: false),
                    Country = table.Column<string>(type: "text", nullable: false),
                    Region = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    Isp = table.Column<string>(type: "text", nullable: false),
                    UserAgent = table.Column<string>(type: "text", nullable: false),
                    Browser = table.Column<string>(type: "text", nullable: false),
                    BrowserVersion = table.Column<string>(type: "text", nullable: false),
                    Os = table.Column<string>(type: "text", nullable: false),
                    OsVersion = table.Column<string>(type: "text", nullable: false),
                    Device = table.Column<string>(type: "text", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: false),
                    TimeZone = table.Column<string>(type: "text", nullable: false),
                    ScreenWidth = table.Column<int>(type: "integer", nullable: false),
                    ScreenHeight = table.Column<int>(type: "integer", nullable: false),
                    ViewportWidth = table.Column<int>(type: "integer", nullable: false),
                    ViewportHeight = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SiteVisits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SiteVisits_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SiteVisits_CreatedAt",
                table: "SiteVisits",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SiteVisits_Ip_CreatedAt",
                table: "SiteVisits",
                columns: new[] { "Ip", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_SiteVisits_SessionId",
                table: "SiteVisits",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteVisits_UserId",
                table: "SiteVisits",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SiteVisits_VisitorId",
                table: "SiteVisits",
                column: "VisitorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SiteVisits");
        }
    }
}
