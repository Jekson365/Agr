using System.Collections.Generic;

namespace Server.Models;

public class SoilInvestigationDetail
{
    public SoilInvestigation Investigation { get; set; } = new();
    public List<SoilInvestigationResult> Results { get; set; } = [];
}
