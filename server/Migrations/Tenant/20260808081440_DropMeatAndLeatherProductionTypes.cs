using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropMeatAndLeatherProductionTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // "Meat" and "Leather" (the seeded ids 5 and 6) are no longer offered: a production
            // type is what a herd yields over and over, and neither of those is.
            //
            // Scaffolded as a plain DeleteData, which is replaced here. All three FKs into
            // ProductionTypes — from Livestock, AnimalProductions and ProductionMovements — are
            // Restrict, so an unguarded delete throws on any tenant that has already recorded
            // one of these, and a migration that throws leaves that tenant unmigrated.
            //
            // The NOT EXISTS clauses make it a no-op there instead: the row survives, its
            // history stays readable, and the client filters it out of the picker so nothing new
            // can be recorded against it. Name is checked alongside id so a tenant that renamed
            // id 5 to something it actually uses is left alone.
            migrationBuilder.Sql(@"
DELETE FROM ""ProductionTypes"" AS pt
WHERE pt.""Id"" IN (5, 6)
  AND pt.""Name"" IN ('Meat', 'Leather')
  AND NOT EXISTS (SELECT 1 FROM ""Livestock"" l WHERE l.""ProductionTypeId"" = pt.""Id"")
  AND NOT EXISTS (SELECT 1 FROM ""AnimalProductions"" ap WHERE ap.""ProductionTypeId"" = pt.""Id"")
  AND NOT EXISTS (SELECT 1 FROM ""ProductionMovements"" pm WHERE pm.""ProductionTypeId"" = pt.""Id"");");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Puts the two rows back at the ids they held. ON CONFLICT covers the tenants where
            // Up found them in use and left them in place, so this cannot collide.
            migrationBuilder.Sql(@"
INSERT INTO ""ProductionTypes"" (""Id"", ""Name"")
VALUES (5, 'Meat'), (6, 'Leather')
ON CONFLICT (""Id"") DO NOTHING;");
        }
    }
}
