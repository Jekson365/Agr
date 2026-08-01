using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;

namespace Server.Services;

public class NeighbourTerritoryService(
    MasterDbContext master,
    ITenantConnectionProvider connectionProvider,
    ILogger<NeighbourTerritoryService> logger) : INeighbourTerritoryService
{
    /// <summary>
    /// How far out the map reaches, in kilometres. Land beyond this is left off entirely — a
    /// neighbour's included, since a field two valleys away is not what the map is for.
    /// </summary>
    public const double RadiusKm = 10;

    /// <summary>Mean Earth radius, in kilometres.</summary>
    private const double EarthRadiusKm = 6371;

    /// <summary>
    /// Ceiling on how many farmers' databases one map is worth opening. Each one is its own
    /// connection, so a crowded region is served in the order below up to this many rather than by
    /// however many accounts happen to exist.
    /// </summary>
    private const int MaxFarmers = 60;

    public async Task<IEnumerable<NeighbourTerritoryDto>> GetForUserAsync(int userId)
    {
        var self = await master.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (self is null)
        {
            return [];
        }

        var neighbourIds = await AcceptedNeighbourIdsAsync(userId);

        // Where the caller is, for measuring from. Their own land comes first: it is drawn on the
        // map to the metre, whereas the profile pin is a separate thing many people never set.
        var origins = await OriginsAsync(self);

        var candidates = await CandidatesAsync(self, origins, neighbourIds);

        // Anyone's land is welcome on the map, linked or not — but only what is actually within
        // reach. Unless the caller can't be placed at all, in which case there is no circle to cut
        // and everything is shown rather than nothing: an empty map would read as a broken one.
        var canMeasure = origins.Count > 0;

        var territories = new List<NeighbourTerritoryDto>();
        foreach (var candidate in candidates)
        {
            var isNeighbour = neighbourIds.Contains(candidate.Id);
            foreach (var territory in await ReadTerritoriesAsync(candidate))
            {
                var distance = NearestDistanceKm(origins, CenterOf(territory.Boundary));
                if (canMeasure && (distance is null || distance > RadiusKm))
                {
                    continue;
                }

                territory.IsNeighbour = isNeighbour;
                territory.DistanceKm = distance;
                territories.Add(territory);
            }
        }

        return territories;
    }

    public async Task<TerritoryDetailsDto?> GetDetailsAsync(int userId, int ownerId, int farmId)
    {
        var owner = await master.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == ownerId);
        if (owner is null || ownerId == userId)
        {
            // The caller's own land is theirs to read through their own endpoints.
            return null;
        }

        var self = await master.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
        if (self is null)
        {
            return null;
        }

        var origins = await OriginsAsync(self);
        var isNeighbour = (await AcceptedNeighbourIdsAsync(userId)).Contains(ownerId);

        try
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionProvider.BuildConnectionString(DatabaseNameFor(owner)))
                .Options;

            await using var db = new AppDbContext(options);

            var farm = await db.Farms.AsNoTracking().FirstOrDefaultAsync(f => f.Id == farmId);
            if (farm is null || string.IsNullOrEmpty(farm.Boundary) || farm.Boundary == "[]")
            {
                return null;
            }

            // The same reach the list applies. Without it, a farm id and a user id would be enough
            // to read anyone's land from anywhere, which is not what being on the map allows.
            var distance = NearestDistanceKm(origins, CenterOf(farm.Boundary));
            if (origins.Count > 0 && (distance is null || distance > RadiusKm))
            {
                return null;
            }

            // A plot may name a particular fruit entry rather than just its kind, so those are
            // looked up too — "Gala" says more than "Apple".
            var plots = await db.LandPlots.AsNoTracking().Where(p => p.FarmId == farmId).ToListAsync();
            var treeStockIds = plots.Where(p => p.TreeStockId != null).Select(p => p.TreeStockId!.Value).Distinct().ToList();
            var treeStocks = treeStockIds.Count == 0
                ? []
                : await db.TreeStocks.AsNoTracking().Where(s => treeStockIds.Contains(s.Id)).ToListAsync();

            return new TerritoryDetailsDto
            {
                UserId = owner.Id,
                Name = owner.Name,
                Surname = owner.Surname,
                ImagePath = owner.ImagePath,
                City = owner.City,
                Country = owner.Country,
                IsNeighbour = isNeighbour,
                DistanceKm = distance,
                FarmId = farm.Id,
                FarmName = farm.Name,
                Area = farm.Area,
                Crops = plots.Select(plot => new TerritoryCropDto
                {
                    Crop = plot.Crop,
                    Name = treeStocks.FirstOrDefault(stock => stock.Id == plot.TreeStockId)?.Name ?? string.Empty,
                    Area = plot.Area,
                }).ToList(),
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not read territory {FarmId} from farm database of user {UserId}.", farmId, ownerId);
            return null;
        }
    }

    private async Task<List<int>> AcceptedNeighbourIdsAsync(int userId) =>
        await master.Neighbours
            .AsNoTracking()
            .Where(n => n.Status == NeighbourStatus.Accepted)
            .Where(n => n.RequesterId == userId || n.AddresseeId == userId)
            .Select(n => n.RequesterId == userId ? n.AddresseeId : n.RequesterId)
            .ToListAsync();

    /// <summary>
    /// The points the caller counts as "here": the middle of each piece of land they have outlined,
    /// plus the pin on their profile if they set one. A farmer with fields in two valleys is near
    /// both, so distance is measured to whichever origin is closest.
    /// </summary>
    private async Task<List<(double Lat, double Lng)>> OriginsAsync(User self)
    {
        var origins = new List<(double Lat, double Lng)>();

        foreach (var territory in await ReadTerritoriesAsync(self))
        {
            if (CenterOf(territory.Boundary) is { } center)
            {
                origins.Add(center);
            }
        }

        if (self.Latitude is { } lat && self.Longitude is { } lng)
        {
            origins.Add((lat, lng));
        }

        return origins;
    }

    /// <summary>
    /// Every other farmer, ordered by how much the caller is likely to care: their neighbours
    /// first, then whoever's profile pin sits nearest. Nothing is excluded on distance — the order
    /// only decides who survives <see cref="MaxFarmers"/> when there are more accounts than one
    /// map's worth of database connections.
    /// </summary>
    private async Task<List<User>> CandidatesAsync(User self, List<(double Lat, double Lng)> origins, List<int> neighbourIds)
    {
        var everyone = await master.Users.AsNoTracking().Where(u => u.Id != self.Id).ToListAsync();

        return everyone
            .Select(user => new
            {
                User = user,
                IsNeighbour = neighbourIds.Contains(user.Id),
                // Only a hint for the ordering: the pin is a profile field many people never set,
                // and where their land actually is only becomes known once it is read.
                PinDistance = user.Latitude is { } lat && user.Longitude is { } lng
                    ? NearestDistanceKm(origins, (lat, lng))
                    : null,
            })
            .OrderByDescending(entry => entry.IsNeighbour)
            .ThenBy(entry => entry.PinDistance ?? double.MaxValue)
            .Take(MaxFarmers)
            .Select(entry => entry.User)
            .ToList();
    }

    /// <summary>
    /// Opens one farmer's own database and takes the land they have outlined. A database that
    /// can't be read — not yet provisioned, mid-migration, offline — is skipped rather than allowed
    /// to fail the whole map: the rest of the neighbourhood still draws.
    /// </summary>
    private async Task<List<NeighbourTerritoryDto>> ReadTerritoriesAsync(User farmer)
    {
        var databaseName = DatabaseNameFor(farmer);

        try
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionProvider.BuildConnectionString(databaseName))
                .Options;

            await using var db = new AppDbContext(options);

            // "[]" is a territory that was drawn and then cleared — nothing to put on a map.
            var farms = await db.Farms
                .AsNoTracking()
                .Where(f => f.Boundary != null && f.Boundary != "" && f.Boundary != "[]")
                .ToListAsync();

            return farms.Select(farm => new NeighbourTerritoryDto
            {
                UserId = farmer.Id,
                Name = farmer.Name,
                Surname = farmer.Surname,
                FarmId = farm.Id,
                FarmName = farm.Name,
                Boundary = farm.Boundary ?? string.Empty,
                Area = farm.Area,
            }).ToList();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not read territories from farm database {Database}.", databaseName);
            return [];
        }
    }

    /// <summary>Where a farmer's data lives. Recorded on the row, but derivable for any account
    /// created before it was.</summary>
    private static string DatabaseNameFor(User farmer) =>
        string.IsNullOrEmpty(farmer.DbName) ? $"farm_user_{farmer.Id}" : farmer.DbName;

    /// <summary>
    /// The middle of a stored outline — a JSON array of <c>[latitude, longitude]</c> pairs. The
    /// plain average of the corners, which at the size of a field is within metres of the true
    /// centroid. Null for anything that isn't an outline.
    /// </summary>
    private static (double Lat, double Lng)? CenterOf(string boundary)
    {
        if (string.IsNullOrWhiteSpace(boundary))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(boundary);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            double latSum = 0, lngSum = 0;
            var count = 0;
            foreach (var point in document.RootElement.EnumerateArray())
            {
                if (point.ValueKind != JsonValueKind.Array || point.GetArrayLength() < 2)
                {
                    continue;
                }
                if (!point[0].TryGetDouble(out var lat) || !point[1].TryGetDouble(out var lng))
                {
                    continue;
                }
                latSum += lat;
                lngSum += lng;
                count++;
            }

            return count == 0 ? null : (latSum / count, lngSum / count);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>Distance to the closest of the caller's origins, or null if either end is unknown.</summary>
    private static double? NearestDistanceKm(List<(double Lat, double Lng)> origins, (double Lat, double Lng)? target)
    {
        if (origins.Count == 0 || target is not { } point)
        {
            return null;
        }

        return origins.Min(origin => DistanceKm(origin, point));
    }

    /// <summary>Great-circle distance between two points on the globe, in kilometres.</summary>
    private static double DistanceKm((double Lat, double Lng) from, (double Lat, double Lng) to)
    {
        var dLat = ToRadians(to.Lat - from.Lat);
        var dLng = ToRadians(to.Lng - from.Lng);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
            + Math.Cos(ToRadians(from.Lat)) * Math.Cos(ToRadians(to.Lat)) * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return Math.Round(EarthRadiusKm * c, 1);
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
