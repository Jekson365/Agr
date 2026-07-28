namespace Server.Models;

/// <summary>
/// How a tree stock item's amount is measured. New fruit entries are always counted as
/// <see cref="Plant"/> — an orchard is recorded as a number of trees, not a weight. The other
/// two are kept for rows created before that, so their stored amounts keep their meaning.
/// </summary>
public enum TreeStockUnit
{
    Kilogram,
    Box,

    /// <summary>Individual trees or plants ("ძირი").</summary>
    Plant,
}
