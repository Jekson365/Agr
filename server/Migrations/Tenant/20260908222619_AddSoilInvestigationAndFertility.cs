using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddSoilInvestigationAndFertility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SoilInvestigations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LandPlotId = table.Column<int>(type: "integer", nullable: false),
                    InvestigationDate = table.Column<DateOnly>(type: "date", nullable: false),
                    SamplingDate = table.Column<DateOnly>(type: "date", nullable: true),
                    SamplingDepthCm = table.Column<decimal>(type: "numeric", nullable: true),
                    Laboratory = table.Column<string>(type: "text", nullable: false),
                    SampleNumber = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false),
                    ReportPath = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilInvestigations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilInvestigations_LandPlots_LandPlotId",
                        column: x => x.LandPlotId,
                        principalTable: "LandPlots",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoilParameterDefinitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "text", nullable: false),
                    Group = table.Column<string>(type: "text", nullable: false),
                    ValueKind = table.Column<string>(type: "text", nullable: false),
                    DefaultUnit = table.Column<string>(type: "text", nullable: false),
                    SupportsForms = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    IsRegulationParameter = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilParameterDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SoilScoringRuleSets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<string>(type: "text", nullable: false),
                    Version = table.Column<string>(type: "text", nullable: false),
                    EffectiveFrom = table.Column<DateOnly>(type: "date", nullable: false),
                    EffectiveTo = table.Column<DateOnly>(type: "date", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    PointSelection = table.Column<string>(type: "text", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilScoringRuleSets", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SoilInvestigationResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SoilInvestigationId = table.Column<int>(type: "integer", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    Form = table.Column<string>(type: "text", nullable: false),
                    NumericValue = table.Column<decimal>(type: "numeric", nullable: true),
                    TextValue = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    Unit = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilInvestigationResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilInvestigationResults_SoilInvestigations_SoilInvestigati~",
                        column: x => x.SoilInvestigationId,
                        principalTable: "SoilInvestigations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SoilInvestigationResults_SoilParameterDefinitions_Parameter~",
                        column: x => x.ParameterId,
                        principalTable: "SoilParameterDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SoilParameterCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParameterId = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilParameterCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilParameterCategories_SoilParameterDefinitions_ParameterId",
                        column: x => x.ParameterId,
                        principalTable: "SoilParameterDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoilFertilityAssessments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LandPlotId = table.Column<int>(type: "integer", nullable: false),
                    SoilInvestigationId = table.Column<int>(type: "integer", nullable: false),
                    RuleSetId = table.Column<int>(type: "integer", nullable: false),
                    Score = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    IsComplete = table.Column<bool>(type: "boolean", nullable: false),
                    CalculatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilFertilityAssessments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilFertilityAssessments_SoilInvestigations_SoilInvestigati~",
                        column: x => x.SoilInvestigationId,
                        principalTable: "SoilInvestigations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SoilFertilityAssessments_SoilScoringRuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "SoilScoringRuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SoilFertilityCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleSetId = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    MinScore = table.Column<int>(type: "integer", nullable: false),
                    MaxScore = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilFertilityCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilFertilityCategories_SoilScoringRuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "SoilScoringRuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoilFertilityFactors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleSetId = table.Column<int>(type: "integer", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    MinPoints = table.Column<int>(type: "integer", nullable: false),
                    MaxPoints = table.Column<int>(type: "integer", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    Form = table.Column<string>(type: "text", nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilFertilityFactors", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilFertilityFactors_SoilScoringRuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "SoilScoringRuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoilScoringRules",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RuleSetId = table.Column<int>(type: "integer", nullable: false),
                    FactorId = table.Column<int>(type: "integer", nullable: false),
                    ParameterId = table.Column<int>(type: "integer", nullable: true),
                    Form = table.Column<string>(type: "text", nullable: false),
                    Condition = table.Column<string>(type: "text", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: true),
                    MinValue = table.Column<decimal>(type: "numeric", nullable: true),
                    MaxValue = table.Column<decimal>(type: "numeric", nullable: true),
                    MinInclusive = table.Column<bool>(type: "boolean", nullable: false),
                    MaxInclusive = table.Column<bool>(type: "boolean", nullable: false),
                    PointsMin = table.Column<decimal>(type: "numeric", nullable: false),
                    PointsMax = table.Column<decimal>(type: "numeric", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilScoringRules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilScoringRules_SoilScoringRuleSets_RuleSetId",
                        column: x => x.RuleSetId,
                        principalTable: "SoilScoringRuleSets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SoilFertilityAssessmentResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AssessmentId = table.Column<int>(type: "integer", nullable: false),
                    FactorId = table.Column<int>(type: "integer", nullable: false),
                    FactorKey = table.Column<string>(type: "text", nullable: false),
                    InputValue = table.Column<string>(type: "text", nullable: false),
                    Points = table.Column<decimal>(type: "numeric", nullable: true),
                    PointsMin = table.Column<decimal>(type: "numeric", nullable: false),
                    PointsMax = table.Column<decimal>(type: "numeric", nullable: false),
                    MaximumPoints = table.Column<int>(type: "integer", nullable: false),
                    HasData = table.Column<bool>(type: "boolean", nullable: false),
                    Explanation = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SoilFertilityAssessmentResults", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SoilFertilityAssessmentResults_SoilFertilityAssessments_Ass~",
                        column: x => x.AssessmentId,
                        principalTable: "SoilFertilityAssessments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "SoilParameterDefinitions",
                columns: new[] { "Id", "DefaultUnit", "Group", "IsRegulationParameter", "Key", "SortOrder", "SupportsForms", "ValueKind" },
                values: new object[,]
                {
                    { 1, "", "FieldConditions", true, "relief", 1, false, "Category" },
                    { 2, "", "FieldConditions", true, "vegetationCover", 2, false, "Category" },
                    { 3, "", "Physical", true, "mechanicalComposition", 10, false, "Category" },
                    { 4, "", "Physical", true, "soilStructure", 11, false, "Category" },
                    { 5, "%", "Physical", false, "fieldCapacity", 12, false, "Numeric" },
                    { 6, "g/cm3", "Physical", false, "bulkDensity", 13, false, "Numeric" },
                    { 7, "%", "Physical", false, "porosity", 14, false, "Numeric" },
                    { 8, "mm/h", "Physical", false, "permeability", 15, false, "Numeric" },
                    { 9, "%", "Chemical", true, "carbonates", 20, false, "Numeric" },
                    { 10, "pH", "Chemical", true, "ph", 21, false, "Numeric" },
                    { 11, "", "Chemical", true, "acidity", 22, false, "Numeric" },
                    { 12, "%", "Chemical", true, "humus", 23, false, "Numeric" },
                    { 13, "", "Nutrients", true, "nitrogen", 30, true, "Numeric" },
                    { 14, "", "Nutrients", true, "phosphorus", 31, true, "Numeric" },
                    { 15, "", "Nutrients", true, "potassium", 32, true, "Numeric" },
                    { 16, "", "AbsorbedBases", true, "absorbedBaseComposition", 40, false, "Category" },
                    { 17, "", "AbsorbedBases", true, "calcium", 41, false, "Numeric" },
                    { 18, "", "AbsorbedBases", true, "calciumMagnesium", 42, false, "Numeric" },
                    { 19, "", "AbsorbedBases", true, "sodium", 43, false, "Numeric" },
                    { 20, "", "AbsorbedBases", true, "hydrogenAcidity", 44, false, "Numeric" }
                });

            migrationBuilder.InsertData(
                table: "SoilScoringRuleSets",
                columns: new[] { "Id", "EffectiveFrom", "EffectiveTo", "IsActive", "MaxScore", "Name", "Notes", "PointSelection", "Source", "Version" },
                values: new object[] { 1, new DateOnly(2014, 1, 1), null, true, 100, "Georgian Soil Fertility Assessment", "Seeded from the task specification, not from the regulation document. Rules are supplied for mechanical composition, structure and pH only. Humus, relief, vegetation cover, absorbed bases, hydrophysical properties and the soil quality factor have no rules until the regulation tables are provided.", "Minimum", "Technical Regulation", "unverified" });

            migrationBuilder.InsertData(
                table: "SoilFertilityCategories",
                columns: new[] { "Id", "Key", "MaxScore", "MinScore", "RuleSetId", "SortOrder" },
                values: new object[,]
                {
                    { 1, "highlyFertile", 100, 81, 1, 1 },
                    { 2, "fertile", 80, 71, 1, 2 },
                    { 3, "moderatelyFertile", 70, 61, 1, 3 },
                    { 4, "lowFertility", 60, 41, 1, 4 },
                    { 5, "infertile", 40, 21, 1, 5 },
                    { 6, "veryPoor", 20, 0, 1, 6 }
                });

            migrationBuilder.InsertData(
                table: "SoilFertilityFactors",
                columns: new[] { "Id", "Form", "IsRequired", "Key", "MaxPoints", "MinPoints", "ParameterId", "RuleSetId", "SortOrder" },
                values: new object[,]
                {
                    { 1, "None", true, "relief", 5, 1, 1, 1, 1 },
                    { 2, "None", true, "vegetationCover", 5, 1, 2, 1, 2 },
                    { 3, "None", true, "mechanicalComposition", 10, 1, 3, 1, 3 },
                    { 4, "None", true, "structure", 5, 1, 4, 1, 4 },
                    { 5, "None", true, "humus", 30, 1, 12, 1, 5 },
                    { 6, "None", true, "acidityAlkalinity", 15, 1, 16, 1, 6 },
                    { 7, "None", true, "hydrophysicalProperties", 10, 1, null, 1, 7 },
                    { 8, "None", true, "soilQuality", 10, 1, null, 1, 8 },
                    { 9, "None", true, "ph", 10, 1, 10, 1, 9 }
                });

            migrationBuilder.InsertData(
                table: "SoilParameterCategories",
                columns: new[] { "Id", "Key", "ParameterId", "SortOrder" },
                values: new object[,]
                {
                    { 1, "heavyClay", 3, 1 },
                    { 2, "mediumClay", 3, 2 },
                    { 3, "otherClay", 3, 3 },
                    { 4, "sandyHeavyLoam", 3, 4 },
                    { 5, "mediumLoam", 3, 5 },
                    { 6, "silt", 3, 6 },
                    { 7, "sand", 3, 7 },
                    { 8, "wellStructured", 4, 1 },
                    { 9, "moderatelyStructured", 4, 2 },
                    { 10, "weaklyStructured", 4, 3 },
                    { 11, "structureless", 4, 4 },
                    { 12, "calcium", 16, 1 },
                    { 13, "calciumMagnesium", 16, 2 },
                    { 14, "sodium", 16, 3 },
                    { 15, "hydrogen", 16, 4 }
                });

            migrationBuilder.InsertData(
                table: "SoilScoringRules",
                columns: new[] { "Id", "CategoryId", "Condition", "FactorId", "Form", "MaxInclusive", "MaxValue", "MinInclusive", "MinValue", "ParameterId", "PointsMax", "PointsMin", "Priority", "RuleSetId" },
                values: new object[,]
                {
                    { 1, 1, "Category", 3, "None", false, null, true, null, 3, 10m, 9m, 1, 1 },
                    { 2, 2, "Category", 3, "None", false, null, true, null, 3, 9m, 8m, 2, 1 },
                    { 3, 3, "Category", 3, "None", false, null, true, null, 3, 8m, 6m, 3, 1 },
                    { 4, 4, "Category", 3, "None", false, null, true, null, 3, 6m, 5m, 4, 1 },
                    { 5, 5, "Category", 3, "None", false, null, true, null, 3, 4m, 3m, 5, 1 },
                    { 6, 6, "Category", 3, "None", false, null, true, null, 3, 2m, 2m, 6, 1 },
                    { 7, 7, "Category", 3, "None", false, null, true, null, 3, 1m, 1m, 7, 1 },
                    { 8, 8, "Category", 4, "None", false, null, true, null, 4, 5m, 5m, 1, 1 },
                    { 9, 9, "Category", 4, "None", false, null, true, null, 4, 4m, 3m, 2, 1 },
                    { 10, 10, "Category", 4, "None", false, null, true, null, 4, 3m, 2m, 3, 1 },
                    { 11, 11, "Category", 4, "None", false, null, true, null, 4, 1m, 1m, 4, 1 },
                    { 12, null, "Range", 9, "None", true, 7.0m, true, 6.5m, 10, 10m, 9m, 1, 1 },
                    { 13, null, "Range", 9, "None", false, 6.5m, true, 5.0m, 10, 9m, 6m, 2, 1 },
                    { 14, null, "Range", 9, "None", false, 5.0m, true, 4.0m, 10, 6m, 4m, 3, 1 },
                    { 15, null, "Range", 9, "None", false, 4.0m, true, 3.0m, 10, 4m, 2m, 4, 1 },
                    { 16, null, "Range", 9, "None", false, 3.0m, true, null, 10, 1m, 1m, 5, 1 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_SoilFertilityAssessmentResults_AssessmentId",
                table: "SoilFertilityAssessmentResults",
                column: "AssessmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SoilFertilityAssessments_RuleSetId",
                table: "SoilFertilityAssessments",
                column: "RuleSetId");

            migrationBuilder.CreateIndex(
                name: "IX_SoilFertilityAssessments_SoilInvestigationId",
                table: "SoilFertilityAssessments",
                column: "SoilInvestigationId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoilFertilityCategories_RuleSetId",
                table: "SoilFertilityCategories",
                column: "RuleSetId");

            migrationBuilder.CreateIndex(
                name: "IX_SoilFertilityFactors_RuleSetId_Key",
                table: "SoilFertilityFactors",
                columns: new[] { "RuleSetId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoilInvestigationResults_ParameterId",
                table: "SoilInvestigationResults",
                column: "ParameterId");

            migrationBuilder.CreateIndex(
                name: "IX_SoilInvestigationResults_SoilInvestigationId_ParameterId_Fo~",
                table: "SoilInvestigationResults",
                columns: new[] { "SoilInvestigationId", "ParameterId", "Form" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoilInvestigations_LandPlotId_InvestigationDate",
                table: "SoilInvestigations",
                columns: new[] { "LandPlotId", "InvestigationDate" });

            migrationBuilder.CreateIndex(
                name: "IX_SoilParameterCategories_ParameterId_Key",
                table: "SoilParameterCategories",
                columns: new[] { "ParameterId", "Key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoilParameterDefinitions_Key",
                table: "SoilParameterDefinitions",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SoilScoringRules_RuleSetId_FactorId_Priority",
                table: "SoilScoringRules",
                columns: new[] { "RuleSetId", "FactorId", "Priority" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SoilFertilityAssessmentResults");

            migrationBuilder.DropTable(
                name: "SoilFertilityCategories");

            migrationBuilder.DropTable(
                name: "SoilFertilityFactors");

            migrationBuilder.DropTable(
                name: "SoilInvestigationResults");

            migrationBuilder.DropTable(
                name: "SoilParameterCategories");

            migrationBuilder.DropTable(
                name: "SoilScoringRules");

            migrationBuilder.DropTable(
                name: "SoilFertilityAssessments");

            migrationBuilder.DropTable(
                name: "SoilParameterDefinitions");

            migrationBuilder.DropTable(
                name: "SoilInvestigations");

            migrationBuilder.DropTable(
                name: "SoilScoringRuleSets");
        }
    }
}
