using Server.Data;
using Server.Models;

namespace Server.Repositories;

public static class LivestockSaleQueries
{
    public static IQueryable<LivestockDetail> AvailableForSale(AppDbContext context) =>
        context.LivestockDetails.Where(d =>
            d.MarketOrderId == null
            && context.Livestock.Any(l => l.Id == d.LivestockId && !l.IsDeleted)
            && !context.AnimalProductions.Any(p => p.IsRealization && p.AnimalId == d.Id));
}
