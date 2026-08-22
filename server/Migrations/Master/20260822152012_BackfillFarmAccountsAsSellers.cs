using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Master
{
    /// <inheritdoc />
    public partial class BackfillFarmAccountsAsSellers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE ""Users""
SET ""IsSeller"" = true,
    ""SellerRegisteredAt"" = COALESCE(""SellerRegisteredAt"", now())
WHERE ""HasManagementAccess"" = true
  AND ""IsSeller"" = false;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
UPDATE ""Users""
SET ""IsSeller"" = false
WHERE ""HasManagementAccess"" = true
  AND NOT EXISTS (SELECT 1 FROM ""MarketListings"" ml WHERE ml.""SellerId"" = ""Users"".""Id"");");
        }
    }
}
