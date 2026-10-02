using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Server.Data;
using Server.Models;
using Server.Models.Admin;
using Server.Repositories.Interfaces;
using Server.Services;

namespace Server.Repositories;

public partial class SiteVisitRepository(
    MasterDbContext context,
    IOptions<VisitTrackingOptions> trackingOptions) : ISiteVisitRepository
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

    private async Task<List<string>> ExcludedVisitorIdsAsync()
    {
        var emails = trackingOptions.Value.ExcludedEmails
            .Select(e => e.Trim().ToLowerInvariant())
            .Where(e => e.Length > 0)
            .ToList();
        if (emails.Count == 0)
        {
            return [];
        }

        var userIds = await context.Users.AsNoTracking()
            .Where(u => emails.Contains(u.Email))
            .Select(u => u.Id)
            .ToListAsync();
        if (userIds.Count == 0)
        {
            return [];
        }

        return await context.SiteVisits.AsNoTracking()
            .Where(v => v.UserId != null && userIds.Contains(v.UserId.Value))
            .Select(v => v.VisitorId)
            .Distinct()
            .ToListAsync();
    }

    private IQueryable<SiteVisit> Period(DateTime since, bool includeBots, List<string> excluded)
    {
        var query = context.SiteVisits.AsNoTracking().Where(v => v.CreatedAt >= since);
        if (excluded.Count > 0)
        {
            query = query.Where(v => !excluded.Contains(v.VisitorId));
        }

        return includeBots ? query : query.Where(v => v.Device != VisitDevice.Bot);
    }

    private IQueryable<SiteVisit> Matching(VisitFilter filter, DateTime since, List<string> excluded)
    {
        var query = Period(since, filter.IncludeBots, excluded);

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
