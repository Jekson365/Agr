using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data;

public partial class AppDbContext
{
    private static void ConfigureSoil(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<SoilScoringRuleSet>().Property(r => r.PointSelection).HasConversion<string>();
        modelBuilder.Entity<SoilScoringRuleSet>().HasData(SoilRegulationSeed.RuleSets);

        modelBuilder.Entity<SoilParameterDefinition>().Property(p => p.Group).HasConversion<string>();
        modelBuilder.Entity<SoilParameterDefinition>().Property(p => p.ValueKind).HasConversion<string>();
        modelBuilder.Entity<SoilParameterDefinition>().HasIndex(p => p.Key).IsUnique();
        modelBuilder.Entity<SoilParameterDefinition>().HasData(SoilParameterSeed.Parameters);

        modelBuilder.Entity<SoilParameterCategory>()
            .HasOne<SoilParameterDefinition>().WithMany().HasForeignKey(c => c.ParameterId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilParameterCategory>().HasIndex(c => new { c.ParameterId, c.Key }).IsUnique();
        modelBuilder.Entity<SoilParameterCategory>().HasData(SoilParameterSeed.Categories);

        modelBuilder.Entity<SoilFertilityFactor>()
            .HasOne<SoilScoringRuleSet>().WithMany().HasForeignKey(f => f.RuleSetId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilFertilityFactor>().Property(f => f.Form).HasConversion<string>();
        modelBuilder.Entity<SoilFertilityFactor>().HasIndex(f => new { f.RuleSetId, f.Key }).IsUnique();
        modelBuilder.Entity<SoilFertilityFactor>().HasData(SoilRegulationSeed.Factors);

        modelBuilder.Entity<SoilFertilityCategory>()
            .HasOne<SoilScoringRuleSet>().WithMany().HasForeignKey(c => c.RuleSetId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilFertilityCategory>().HasData(SoilRegulationSeed.FertilityCategories);

        modelBuilder.Entity<SoilScoringRule>()
            .HasOne<SoilScoringRuleSet>().WithMany().HasForeignKey(r => r.RuleSetId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilScoringRule>().Property(r => r.Condition).HasConversion<string>();
        modelBuilder.Entity<SoilScoringRule>().Property(r => r.Form).HasConversion<string>();
        modelBuilder.Entity<SoilScoringRule>().HasIndex(r => new { r.RuleSetId, r.FactorId, r.Priority });
        modelBuilder.Entity<SoilScoringRule>().HasData(SoilRegulationSeed.Rules);

        modelBuilder.Entity<SoilInvestigation>()
            .HasOne<LandPlot>().WithMany().HasForeignKey(i => i.LandPlotId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilInvestigation>().Property(i => i.Status).HasConversion<string>();
        modelBuilder.Entity<SoilInvestigation>().HasIndex(i => new { i.LandPlotId, i.InvestigationDate });

        modelBuilder.Entity<SoilInvestigationResult>()
            .HasOne<SoilInvestigation>().WithMany().HasForeignKey(r => r.SoilInvestigationId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilInvestigationResult>()
            .HasOne<SoilParameterDefinition>().WithMany().HasForeignKey(r => r.ParameterId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<SoilInvestigationResult>().Property(r => r.Form).HasConversion<string>();
        modelBuilder.Entity<SoilInvestigationResult>()
            .HasIndex(r => new { r.SoilInvestigationId, r.ParameterId, r.Form }).IsUnique();

        modelBuilder.Entity<SoilFertilityAssessment>()
            .HasOne<SoilInvestigation>().WithMany().HasForeignKey(a => a.SoilInvestigationId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<SoilFertilityAssessment>()
            .HasOne<SoilScoringRuleSet>().WithMany().HasForeignKey(a => a.RuleSetId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<SoilFertilityAssessment>().HasIndex(a => a.SoilInvestigationId).IsUnique();

        modelBuilder.Entity<SoilFertilityAssessmentResult>()
            .HasOne<SoilFertilityAssessment>().WithMany().HasForeignKey(r => r.AssessmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
