using Microsoft.EntityFrameworkCore;
using Server.Models.Admin;
using Server.Services;

namespace Server.Repositories;

public partial class SiteVisitRepository
{
    public async Task<VisitSessionListDto> GetSessionsAsync(VisitFilter filter, int page, int pageSize)
    {
        var since = string.IsNullOrWhiteSpace(filter.VisitorId)
            ? VisitWindow.For(filter.Days, filter.TimeZone).SinceUtc
            : VisitWindow.Beginning;
        var excluded = await ExcludedVisitorIdsAsync();
        var visits = Matching(filter, since, excluded);

        var total = await visits.Select(v => v.SessionId).Distinct().CountAsync();
        var sessionIds = await visits
            .GroupBy(v => v.SessionId)
            .Select(g => new { SessionId = g.Key, StartedAt = g.Min(v => v.CreatedAt) })
            .OrderByDescending(s => s.StartedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => s.SessionId)
            .ToListAsync();

        var rows = await context.SiteVisits.AsNoTracking()
            .Where(v => sessionIds.Contains(v.SessionId))
            .OrderBy(v => v.CreatedAt)
            .ToListAsync();

        var sessions = rows
            .GroupBy(r => r.SessionId)
            .ToDictionary(g => g.Key, g => VisitSessionDto.From(g.ToList()));

        await DescribeVisitorsAsync(sessions.Values);
        await DescribeUsersAsync(sessions.Values);

        return new VisitSessionListDto
        {
            Items = sessionIds.Where(sessions.ContainsKey).Select(id => sessions[id]).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    private async Task DescribeVisitorsAsync(ICollection<VisitSessionDto> sessions)
    {
        var visitorIds = sessions.Select(s => s.VisitorId).Distinct().ToList();
        if (visitorIds.Count == 0)
        {
            return;
        }

        var stats = await context.SiteVisits.AsNoTracking()
            .Where(v => visitorIds.Contains(v.VisitorId))
            .GroupBy(v => v.VisitorId)
            .Select(g => new
            {
                VisitorId = g.Key,
                FirstSeen = g.Min(v => v.CreatedAt),
                Sessions = g.Select(v => v.SessionId).Distinct().Count(),
            })
            .ToDictionaryAsync(s => s.VisitorId);

        foreach (var session in sessions)
        {
            if (stats.TryGetValue(session.VisitorId, out var stat))
            {
                session.VisitorFirstSeen = stat.FirstSeen;
                session.VisitorSessions = stat.Sessions;
            }
        }
    }

    private async Task DescribeUsersAsync(ICollection<VisitSessionDto> sessions)
    {
        var userIds = sessions.Where(s => s.UserId is not null).Select(s => s.UserId!.Value).Distinct().ToList();
        if (userIds.Count == 0)
        {
            return;
        }

        var users = await context.Users.AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, u.Name, u.Surname, u.Email, u.PhoneNumber })
            .ToDictionaryAsync(u => u.Id);

        foreach (var session in sessions)
        {
            if (session.UserId is int id && users.TryGetValue(id, out var user))
            {
                session.UserName = $"{user.Name} {user.Surname}".Trim();
                session.UserContact = user.Email.Length > 0 ? user.Email : user.PhoneNumber;
            }
        }
    }
}
