namespace Server.Models.Reports;

/// <summary>Which domain the /report page is showing.</summary>
public enum ReportCategory
{
    Crop,
    Livestock,
    Fruit,
    Greenhouse,
}

/// <summary>How the period filter is expressed. Mirrors the chips on the report's filter panel.</summary>
public enum ReportPeriodMode
{
    All,
    Year,
    Quarter,
    Custom,
}

/// <summary>
/// The period filter, bound from the query string. Harvest dates are plain days and production
/// collection dates are days stored at UTC midnight, so everything here compares as a calendar
/// day — no timezone conversion enters the aggregation.
/// </summary>
public class ReportPeriod
{
    public ReportPeriodMode Mode { get; set; } = ReportPeriodMode.All;
    public int? Year { get; set; }
    public int? Quarter { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }

    /// <summary>Whether a calendar day falls inside this period.</summary>
    public bool Contains(DateOnly day) => Mode switch
    {
        ReportPeriodMode.Year => Year is null || day.Year == Year,
        ReportPeriodMode.Quarter =>
            (Year is null || day.Year == Year) && (Quarter is null || (day.Month - 1) / 3 + 1 == Quarter),
        ReportPeriodMode.Custom => (From is null || day >= From) && (To is null || day <= To),
        _ => true,
    };
}

/// <summary>One column of the value-over-time chart: a day and what it was worth.</summary>
public class ReportValuePoint
{
    /// <summary>The calendar day, as `yyyy-MM-dd`.</summary>
    public string Day { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

/// <summary>
/// A selectable series in the grouped chart — one stock, orchard or production type. Carries the
/// raw names rather than display text: the label and icon are resolved on the client, which owns
/// the translations and the artwork.
/// </summary>
public class ReportSeries
{
    public string Key { get; set; } = string.Empty;

    /// <summary>The row's own name, when it has one (a stock or orchard can be named).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>The StockKind / FruitKind / ProductionType name behind it, for label and icon.</summary>
    public string TypeName { get; set; } = string.Empty;

    /// <summary>Which catalog <see cref="TypeName"/> belongs to: `stock`, `tree`, `treeProduct` or `productionType`.</summary>
    public string Kind { get; set; } = string.Empty;

    /// <summary>The unit's stored name (e.g. `Kilogram`), or a Unit's short name for production.</summary>
    public string Unit { get; set; } = string.Empty;
}

/// <summary>One x-group of the grouped chart: a harvest record, or a day for livestock.</summary>
public class ReportGroup
{
    public string Day { get; set; } = string.Empty;

    /// <summary>The group's own label — a harvest title. Empty means "use the day".</summary>
    public string Label { get; set; } = string.Empty;

    /// <summary>Amount per series key. Series absent from a group count as zero.</summary>
    public Dictionary<string, decimal> Values { get; set; } = [];
}

/// <summary>Cells 1 and 2 of the report in one payload — they share the same source rows.</summary>
public class ReportOverview
{
    public List<ReportValuePoint> Value { get; set; } = [];
    public List<ReportSeries> Series { get; set; } = [];
    public List<ReportGroup> Groups { get; set; } = [];
}

/// <summary>An amount of one good, for the planned / sown / harvested lines of a day's card.</summary>
public class ReportGood
{
    public string Name { get; set; } = string.Empty;
    public string TypeName { get; set; } = string.Empty;

    /// <summary>`stock`, `tree`, `seed` or `treeProduct` — picks the client's label and icon lookup.</summary>
    public string Kind { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;
}

/// <summary>One harvest on the selected day, with its money and its goods already totalled.</summary>
public class ReportDayHarvest
{
    public int HarvestId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsFruit { get; set; }
    public decimal Revenue { get; set; }

    /// <summary>The fixed cost fields plus every chemical applied — the client no longer adds these
    /// up, so the figure can't be rendered before the chemicals are known.</summary>
    public decimal Expenses { get; set; }
    public decimal Net { get; set; }
    public List<ReportGood> Planned { get; set; } = [];

    /// <summary>Seed sown for a crop harvest, trees picked for a fruit one.</summary>
    public List<ReportGood> Input { get; set; } = [];
    public List<ReportGood> Harvested { get; set; } = [];
}

/// <summary>One production record on the selected day.</summary>
public class ReportDayProduction
{
    public int ProductionId { get; set; }
    public string TypeName { get; set; } = string.Empty;
    public decimal Quantity { get; set; }

    /// <summary>The unit's short name, as the record's own row renders it.</summary>
    public string Unit { get; set; } = string.Empty;

    /// <summary>Stored total, or quantity × unit price when only that was entered.</summary>
    public decimal Value { get; set; }
}

/// <summary>Cell 3: what happened on the day whose bar was clicked.</summary>
public class ReportDayDetails
{
    public string Day { get; set; } = string.Empty;
    public List<ReportDayHarvest> Harvests { get; set; } = [];
    public List<ReportDayProduction> Productions { get; set; } = [];
}

/// <summary>One record's contribution to the series whose bar was clicked.</summary>
public class ReportSeriesRecord
{
    public string Label { get; set; } = string.Empty;
    public string Day { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

/// <summary>Cell 4: every record behind one series, and what they add up to.</summary>
public class ReportSeriesDetails
{
    public string Key { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public List<ReportSeriesRecord> Records { get; set; } = [];
}
