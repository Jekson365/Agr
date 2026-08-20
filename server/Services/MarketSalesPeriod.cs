using Server.Models;

namespace Server.Services;

public static class MarketSalesPeriod
{
    private const int WeeksBack = 11;
    private const int MonthsBack = 11;
    private const int YearsBack = 4;

    public static DateOnly BucketStart(DateOnly date, SalesBucketUnit unit) => unit switch
    {
        SalesBucketUnit.Day => date,
        SalesBucketUnit.Week => date.AddDays(-((int)date.DayOfWeek + 6) % 7),
        SalesBucketUnit.Month => new DateOnly(date.Year, date.Month, 1),
        _ => new DateOnly(date.Year, 1, 1),
    };

    public static DateOnly AddUnits(DateOnly date, SalesBucketUnit unit, int count) => unit switch
    {
        SalesBucketUnit.Day => date.AddDays(count),
        SalesBucketUnit.Week => date.AddDays(count * 7),
        SalesBucketUnit.Month => date.AddMonths(count),
        _ => date.AddYears(count),
    };

    private static SalesBucketUnit UnitForSpan(DateOnly start, DateOnly end)
    {
        var days = end.DayNumber - start.DayNumber;
        if (days <= 31) return SalesBucketUnit.Day;
        if (days <= 182) return SalesBucketUnit.Week;
        if (days <= 730) return SalesBucketUnit.Month;
        return SalesBucketUnit.Year;
    }

    public static (DateOnly Start, DateOnly End, SalesBucketUnit Unit) Window(
        SalesPeriodMode mode,
        DateOnly today,
        DateOnly? from,
        DateOnly? to)
    {
        switch (mode)
        {
            case SalesPeriodMode.Week:
                return (AddUnits(BucketStart(today, SalesBucketUnit.Week), SalesBucketUnit.Week, -WeeksBack),
                    today, SalesBucketUnit.Week);
            case SalesPeriodMode.Year:
                return (AddUnits(BucketStart(today, SalesBucketUnit.Year), SalesBucketUnit.Year, -YearsBack),
                    today, SalesBucketUnit.Year);
            case SalesPeriodMode.Custom:
            {
                var start = from ?? AddUnits(BucketStart(today, SalesBucketUnit.Month), SalesBucketUnit.Month, -MonthsBack);
                var end = to ?? today;
                if (start > end)
                {
                    (start, end) = (end, start);
                }
                return (start, end, UnitForSpan(start, end));
            }
            default:
                return (AddUnits(BucketStart(today, SalesBucketUnit.Month), SalesBucketUnit.Month, -MonthsBack),
                    today, SalesBucketUnit.Month);
        }
    }

    public static DateTime StartOfDayUtc(DateOnly date) =>
        DateTime.SpecifyKind(date.ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

    public static DateTime EndExclusiveUtc(DateOnly date) => StartOfDayUtc(date.AddDays(1));
}
