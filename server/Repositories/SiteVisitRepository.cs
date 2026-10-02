using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Models.Admin;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public partial class SiteVisitRepository(MasterDbContext context) : ISiteVisitRepository
{
    public async Task AddAsync(SiteVisit visit)
    {
        if (visit.UserId is int userId && !await context.Users.AnyAsync(u => u.Id == userId))
        {
            visit.UserId = null;
        }

        context.SiteVisits.Add(visit);
        await context.SaveChangesAsync();
    }

    public Task<SiteVisit?> FindLocatedAsync(string ip, DateTime since) =>
        context.SiteVisits.AsNoTracking()
            .Where(v => v.Ip == ip && v.CreatedAt >= since && v.CountryCode != "")
            .OrderByDescending(v => v.CreatedAt)
            .FirstOrDefaultAsync();

    private IQueryable<SiteVisit> Period(DateTime since, bool includeBots)
    {
        var query = context.SiteVisits.AsNoTracking().Where(v => v.CreatedAt >= since);
        return includeBots ? query : query.Where(v => v.Device != VisitDevice.Bot);
    }

    private IQueryable<SiteVisit> Matching(VisitFilter filter, DateTime since)
    {
        var query = Period(since, filter.IncludeBots);

        if (!string.IsNullOrWhiteSpace(filter.VisitorId))
        {
            var visitorId = filter.VisitorId.Trim();
            query = query.Where(v => v.VisitorId == visitorId);
        }

        if (string.IsNullOrWhiteSpace(filter.Search))
        {
            return query;
        }

        var term = LikeTerm(filter.Search);
        return query.Where(v =>
            EF.Functions.ILike(v.Ip, term)
            || EF.Functions.ILike(v.City, term)
            || EF.Functions.ILike(v.Country, term)
            || EF.Functions.ILike(v.Region, term)
            || EF.Functions.ILike(v.Path, term)
            || EF.Functions.ILike(v.Source, term)
            || EF.Functions.ILike(v.Isp, term)
            || EF.Functions.ILike(v.Browser, term)
            || EF.Functions.ILike(v.Os, term)
            || context.Users.Any(u => u.Id == v.UserId
                && (EF.Functions.ILike(u.Email, term)
                    || EF.Functions.ILike(u.Name, term)
                    || EF.Functions.ILike(u.Surname, term)
                    || EF.Functions.ILike(u.PhoneNumber, term))));
    }

    private static string LikeTerm(string search)
    {
        var escaped = search.Trim().Replace("\\", "\\\\").Replace("%", "\\%").Replace("_", "\\_");
        return $"%{escaped}%";
    }
}
