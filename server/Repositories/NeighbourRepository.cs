using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class NeighbourRepository(MasterDbContext context) : INeighbourRepository
{
    public async Task<IEnumerable<NeighbourDto>> GetNeighboursAsync(int userId)
    {
        var links = await LinksFor(userId)
            .Where(n => n.Status == NeighbourStatus.Accepted)
            .ToListAsync();

        var dtos = await DescribeAsync(userId, links);

        // Nearest first — the point of a neighbourhood. Anyone who hasn't pinned their farm has no
        // distance to sort by and goes after those who have, alphabetically.
        return dtos
            .OrderBy(d => d.DistanceKm ?? double.MaxValue)
            .ThenBy(d => d.Name)
            .ToList();
    }

    public async Task<IEnumerable<NeighbourDto>> GetRequestsAsync(int userId)
    {
        var links = await LinksFor(userId)
            .Where(n => n.Status == NeighbourStatus.Pending)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return await DescribeAsync(userId, links);
    }

    public async Task<IEnumerable<NeighbourDto>> SearchAsync(int userId, string term, int limit = 20)
    {
        var trimmed = term.Trim().ToLower();
        if (trimmed.Length == 0)
        {
            return [];
        }

        var matches = await context.Users
            .AsNoTracking()
            .Where(u => u.Id != userId)
            .Where(u => u.Name.ToLower().Contains(trimmed)
                || u.Surname.ToLower().Contains(trimmed)
                || u.Email.ToLower().Contains(trimmed))
            .OrderBy(u => u.Name)
            .ThenBy(u => u.Surname)
            .Take(limit)
            .ToListAsync();

        if (matches.Count == 0)
        {
            return [];
        }

        // Whatever links the caller already has with the people found, so each result can say
        // "neighbour", "asked" or "add" rather than offering to send a request that already exists.
        var matchIds = matches.Select(u => u.Id).ToList();
        var links = await LinksFor(userId)
            .Where(n => matchIds.Contains(n.RequesterId) || matchIds.Contains(n.AddresseeId))
            .ToListAsync();

        var self = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

        return matches
            .Select(user =>
            {
                var link = links.FirstOrDefault(n => Other(n, userId) == user.Id);
                return NeighbourDto.From(user, StateOf(link, userId), DistanceKm(self, user), link);
            })
            .ToList();
    }

    public async Task<NeighbourDto?> RequestAsync(int userId, int otherUserId)
    {
        var other = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == otherUserId);
        if (other is null)
        {
            return null;
        }

        var existing = await LinkBetweenAsync(userId, otherUserId);

        if (existing is null)
        {
            existing = new Neighbour
            {
                RequesterId = userId,
                AddresseeId = otherUserId,
                Status = NeighbourStatus.Pending,
                CreatedAt = DateTime.UtcNow,
            };
            context.Neighbours.Add(existing);
            await context.SaveChangesAsync();
        }
        else if (existing.Status == NeighbourStatus.Pending && existing.AddresseeId == userId)
        {
            // They asked first. Asking back is agreement, so take it as an acceptance instead of
            // leaving two people each waiting on the other.
            existing.Status = NeighbourStatus.Accepted;
            existing.AcceptedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }
        // Anything else — already neighbours, or already asked — is left exactly as it is, so a
        // double click doesn't disturb a settled link.

        return await DescribeAsync(userId, other, existing);
    }

    public async Task<NeighbourDto?> AcceptAsync(int userId, int otherUserId)
    {
        var other = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == otherUserId);
        if (other is null)
        {
            return null;
        }

        var existing = await LinkBetweenAsync(userId, otherUserId);

        // Only the person who was asked can accept, and only while it is still pending. Anything
        // else answers with the state as it stands rather than failing — the client is showing a
        // list that may be a moment out of date.
        if (existing is not null
            && existing.Status == NeighbourStatus.Pending
            && existing.AddresseeId == userId)
        {
            existing.Status = NeighbourStatus.Accepted;
            existing.AcceptedAt = DateTime.UtcNow;
            await context.SaveChangesAsync();
        }

        return await DescribeAsync(userId, other, existing);
    }

    public async Task<bool> RemoveAsync(int userId, int otherUserId)
    {
        var existing = await LinkBetweenAsync(userId, otherUserId);
        if (existing is null)
        {
            return false;
        }

        context.Neighbours.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    /// <summary>Every link this user is either side of. Tracked — the callers that write go
    /// through here too.</summary>
    private IQueryable<Neighbour> LinksFor(int userId) =>
        context.Neighbours.Where(n => n.RequesterId == userId || n.AddresseeId == userId);

    /// <summary>The one link between two users, whichever of them asked. Spelled out in both
    /// directions rather than through <see cref="Other"/>, which is C# the database can't run.</summary>
    private Task<Neighbour?> LinkBetweenAsync(int userId, int otherUserId) =>
        context.Neighbours.FirstOrDefaultAsync(n =>
            (n.RequesterId == userId && n.AddresseeId == otherUserId)
            || (n.RequesterId == otherUserId && n.AddresseeId == userId));

    /// <summary>The end of the link that isn't the given user.</summary>
    private static int Other(Neighbour link, int userId) =>
        link.RequesterId == userId ? link.AddresseeId : link.RequesterId;

    /// <summary>How the link reads to <paramref name="userId"/> — the same pending row is a sent
    /// request to one of them and a received one to the other.</summary>
    private static NeighbourState StateOf(Neighbour? link, int userId)
    {
        if (link is null)
        {
            return NeighbourState.None;
        }
        if (link.Status == NeighbourStatus.Accepted)
        {
            return NeighbourState.Neighbour;
        }
        return link.RequesterId == userId ? NeighbourState.RequestSent : NeighbourState.RequestReceived;
    }

    /// <summary>Fills in the other party's profile and the distance to them for a set of links.</summary>
    private async Task<List<NeighbourDto>> DescribeAsync(int userId, List<Neighbour> links)
    {
        if (links.Count == 0)
        {
            return [];
        }

        var otherIds = links.Select(n => Other(n, userId)).ToList();
        var users = await context.Users
            .AsNoTracking()
            .Where(u => otherIds.Contains(u.Id))
            .ToListAsync();
        var self = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

        var dtos = new List<NeighbourDto>();
        foreach (var link in links)
        {
            var user = users.FirstOrDefault(u => u.Id == Other(link, userId));
            // A link whose other end no longer exists shouldn't have survived the cascade; skip it
            // rather than answer with a blank row.
            if (user is null)
            {
                continue;
            }
            dtos.Add(NeighbourDto.From(user, StateOf(link, userId), DistanceKm(self, user), link));
        }
        return dtos;
    }

    private async Task<NeighbourDto> DescribeAsync(int userId, User other, Neighbour? link)
    {
        var self = await context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        return NeighbourDto.From(other, StateOf(link, userId), DistanceKm(self, other), link);
    }

    /// <summary>Mean Earth radius, in kilometres.</summary>
    private const double EarthRadiusKm = 6371;

    /// <summary>
    /// Great-circle distance between two pinned farm locations, or null unless both have pinned
    /// one. Straight-line, not by road — it answers "how near are we", not "how long to drive".
    /// </summary>
    private static double? DistanceKm(User? from, User? to)
    {
        if (from?.Latitude is not { } fromLat || from.Longitude is not { } fromLng
            || to?.Latitude is not { } toLat || to.Longitude is not { } toLng)
        {
            return null;
        }

        var dLat = ToRadians(toLat - fromLat);
        var dLng = ToRadians(toLng - fromLng);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(fromLat)) * Math.Cos(ToRadians(toLat)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(EarthRadiusKm * c, 1);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
