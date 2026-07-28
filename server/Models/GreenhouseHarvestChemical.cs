namespace Server.Models;

/// <summary>
/// A chemical applied to a <see cref="GreenhouseHarvest"/>, with the date it was applied and what
/// it cost. The cost is rolled into the harvest's final expenses. Plain CRUD — applying a chemical
/// moves no stock balance. The greenhouse counterpart to <see cref="HarvestChemical"/>.
/// </summary>
public class GreenhouseHarvestChemical
{
    public int Id { get; set; }
    public int GreenhouseHarvestId { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public decimal Cost { get; set; }
}
