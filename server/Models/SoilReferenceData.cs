using System.Collections.Generic;

namespace Server.Models;

public class SoilReferenceData
{
    public SoilScoringRuleSet? RuleSet { get; set; }
    public List<SoilParameterDefinition> Parameters { get; set; } = [];
    public List<SoilParameterCategory> Categories { get; set; } = [];
    public List<SoilFertilityFactor> Factors { get; set; } = [];
    public List<SoilFertilityCategory> FertilityCategories { get; set; } = [];
}
