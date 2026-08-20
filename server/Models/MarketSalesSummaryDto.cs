namespace Server.Models;

public enum SalesPeriodMode
{
    Week,
    Month,
    Year,
    Custom,
}

public enum SalesBucketUnit
{
    Day,
    Week,
    Month,
    Year,
}

public class MarketSalesBucketDto
{
    public DateOnly Start { get; set; }
    public decimal Total { get; set; }
    public int Count { get; set; }
}

public class MarketSalesSummaryDto
{
    public SalesBucketUnit Unit { get; set; }
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }
    public List<MarketSalesBucketDto> Buckets { get; set; } = [];
}
