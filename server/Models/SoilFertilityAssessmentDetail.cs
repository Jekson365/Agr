using System.Collections.Generic;

namespace Server.Models;

public class SoilFertilityAssessmentDetail
{
    public SoilFertilityAssessment Assessment { get; set; } = new();
    public List<SoilFertilityAssessmentResult> Results { get; set; } = [];
    public List<string> Limitations { get; set; } = [];
    public List<string> MissingFactors { get; set; } = [];
}
