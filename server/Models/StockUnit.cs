namespace Server.Models;

/// <summary>How a stock item's amount is measured — by weight (kg) or by count.</summary>
public enum StockUnit
{
    Kilogram,
    Quantity,
    Liter,
}
