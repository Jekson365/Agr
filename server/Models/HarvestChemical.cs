namespace Server.Models;

/// <summary>
/// A chemical (fertiliser, pesticide, treatment, …) applied to a <see cref="Harvest"/>, with the
/// date it was applied and what it cost. The cost is rolled into the harvest's final expenses.
/// Plain CRUD — applying a chemical moves no stock balance, like <see cref="HarvestTree"/>.
/// </summary>
public class HarvestChemical
{
    public int Id { get; set; }
    public int HarvestId { get; set; }

    /// <summary>Free-text name of the chemical applied.</summary>
    public string Name { get; set; } = string.Empty;

    public DateOnly Date { get; set; }

    /// <summary>What the chemical cost, added to the harvest's expense total.</summary>
    public decimal Cost { get; set; }
}
