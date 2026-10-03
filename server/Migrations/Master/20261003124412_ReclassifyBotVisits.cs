using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class ReclassifyBotVisits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE \"SiteVisits\" SET \"Device\" = 'Bot' WHERE \"Device\" <> 'Bot' AND (" +
                "(\"ScreenWidth\" = 800 AND \"ScreenHeight\" = 600) OR \"TimeZone\" = 'Etc/Unknown' OR " +
                "lower(\"Isp\") LIKE ANY (ARRAY['%amazon%', '%google llc%', '%google cloud%', '%microsoft%', " +
                "'%ovh%', '%hetzner%', '%digitalocean%', '%linode%', '%vultr%', '%the constant company%', " +
                "'%choopa%', '%contabo%', '%oracle%', '%alibaba%', '%tencent%', '%huawei cloud%', " +
                "'%petersburg internet network%', '%scaleway%', '%leaseweb%', '%hostinger%', '%ionos%', " +
                "'%selectel%', '%timeweb%', '%colocrossing%']));");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
