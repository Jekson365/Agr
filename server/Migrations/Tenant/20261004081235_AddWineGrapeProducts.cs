using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddWineGrapeProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "TreeProducts",
                type: "text",
                nullable: false,
                defaultValue: "Fruit");

            migrationBuilder.AddColumn<int>(
                name: "TreeProductId",
                table: "Stocks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Stocks_TreeProductId",
                table: "Stocks",
                column: "TreeProductId",
                unique: true,
                filter: "\"TreeProductId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_Stocks_TreeProducts_TreeProductId",
                table: "Stocks",
                column: "TreeProductId",
                principalTable: "TreeProducts",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.Sql("""
                DO $$
                DECLARE
                    vineyard record;
                    product_id integer;
                BEGIN
                    FOR vineyard IN
                        SELECT "Id", "Name" FROM "Stocks"
                        WHERE "Category" = 'Wine' AND "TreeProductId" IS NULL
                    LOOP
                        INSERT INTO "TreeProducts" ("Name", "Unit", "Category")
                        VALUES (COALESCE(NULLIF(btrim(vineyard."Name"), ''), 'Grape'), 'Kilogram', 'Wine')
                        RETURNING "Id" INTO product_id;
                        UPDATE "Stocks" SET "TreeProductId" = product_id WHERE "Id" = vineyard."Id";
                    END LOOP;
                END $$;
                """);

            migrationBuilder.Sql("""
                INSERT INTO "HarvestProducts" ("HarvestId", "TreeProductId", "Amount")
                SELECT t."HarvestId", s."TreeProductId", SUM(t."HarvestedAmount")
                FROM "HarvestTrees" t
                JOIN "Stocks" s ON s."Id" = t."StockId"
                WHERE t."HarvestedAmount" > 0
                  AND s."TreeProductId" IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM "HarvestProducts" p
                      WHERE p."HarvestId" = t."HarvestId" AND p."TreeProductId" = s."TreeProductId")
                GROUP BY t."HarvestId", s."TreeProductId";
                """);

            migrationBuilder.Sql("""
                INSERT INTO "TreeProductMovements" ("TreeProductId", "HarvestProductId", "Delta", "Source", "CreatedAt")
                SELECT p."TreeProductId", p."Id", p."Amount", 'Harvest', now()
                FROM "HarvestProducts" p
                JOIN "TreeProducts" tp ON tp."Id" = p."TreeProductId" AND tp."Category" = 'Wine'
                JOIN "Harvests" h ON h."Id" = p."HarvestId" AND h."Status" = 'TransferredToBalance'
                WHERE NOT EXISTS (
                    SELECT 1 FROM "TreeProductMovements" m WHERE m."HarvestProductId" = p."Id");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "TreeProducts" p
                WHERE p."Category" = 'Wine'
                  AND NOT EXISTS (SELECT 1 FROM "HarvestProducts" h WHERE h."TreeProductId" = p."Id");
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Stocks_TreeProducts_TreeProductId",
                table: "Stocks");

            migrationBuilder.DropIndex(
                name: "IX_Stocks_TreeProductId",
                table: "Stocks");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "TreeProducts");

            migrationBuilder.DropColumn(
                name: "TreeProductId",
                table: "Stocks");
        }
    }
}
