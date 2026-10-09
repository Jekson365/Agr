using Microsoft.EntityFrameworkCore;
using Server.Models;
using Server.Models.Admin;

namespace Server.Controllers;

public partial class AdminController
{
    private async Task<Dictionary<int, DateTime>> LastVisitsAsync()
    {
        return await context.SiteVisits.AsNoTracking()
            .Where(v => v.UserId != null)
            .GroupBy(v => v.UserId!.Value)
            .Select(g => new { UserId = g.Key, Last = g.Max(v => v.CreatedAt) })
            .ToDictionaryAsync(x => x.UserId, x => x.Last);
    }

    private async Task<DateTime?> LastVisitAtAsync(int userId)
    {
        return await context.SiteVisits.AsNoTracking()
            .Where(v => v.UserId == userId)
            .MaxAsync(v => (DateTime?)v.CreatedAt);
    }

    private async Task<AdminUserActivityDto> ReadActivityAsync(User user)
    {
        var visits = context.SiteVisits.AsNoTracking().Where(v => v.UserId == user.Id);
        var lastVisit = await visits
            .OrderByDescending(v => v.CreatedAt)
            .Select(v => new AdminVisitDto
            {
                At = v.CreatedAt,
                Device = v.Device,
                Browser = v.Browser,
                Os = v.Os,
                City = v.City,
                CountryCode = v.CountryCode,
                Country = v.Country,
            })
            .FirstOrDefaultAsync();

        var sales = context.MarketOrders.AsNoTracking()
            .Where(o => o.SellerId == user.Id
                && (o.Status == MarketOrderStatus.Paid || o.Status == MarketOrderStatus.Manual));

        return new AdminUserActivityDto
        {
            SignIn = user.PasswordHash == string.Empty
                ? AdminSignInMethod.Google
                : user.SignsInWithPhone ? AdminSignInMethod.Phone : AdminSignInMethod.Email,
            FarmCreatedAt = user.DatabaseCreatedAt,
            StorageUsedBytes = user.StorageUsedBytes,
            StorageLimitBytes = StoragePlanLimits.BytesFor(user.Plan),
            PageViews = await visits.CountAsync(),
            Sessions = await visits.Select(v => v.SessionId).Distinct().CountAsync(),
            LastVisit = lastVisit,
            Neighbours = await context.Neighbours.AsNoTracking().CountAsync(n =>
                n.Status == NeighbourStatus.Accepted && (n.RequesterId == user.Id || n.AddresseeId == user.Id)),
            Sales = await sales.CountAsync(),
            SalesAmount = await sales.SumAsync(o => o.Amount),
        };
    }
}
