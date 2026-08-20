namespace Server.Models.Auth;

public class UserDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    /// <summary>Platform operator. Only ever used by the client to decide whether to offer the
    /// manager page — every admin endpoint checks the database itself.</summary>
    public bool IsSuperAdmin { get; set; }
    public string Surname { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// Whether an SMS code has proved this number. The profile screen uses it to know that the
    /// number is the account's way in and cannot be edited there.
    /// </summary>
    public bool PhoneVerified { get; set; }

    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
    public StoragePlan Plan { get; set; }
    public long StorageUsedBytes { get; set; }
    public int Coins { get; set; }

    /// <summary>Byte quota for <see cref="Plan"/>, or null when the plan is unlimited.</summary>
    public long? StorageLimitBytes { get; set; }

    // The rest of PlanLimits, so the client can display "what your plan allows" without
    // duplicating these numbers itself.
    public int? MaxLand { get; set; }
    public int? MaxLivestockKinds { get; set; }
    public int? MaxStockKinds { get; set; }
    public int? MaxFruitKinds { get; set; }
    public bool BalanceAllowed { get; set; }
    public bool EquipmentAllowed { get; set; }

    public static UserDto From(User user) => new()
    {
        Id = user.Id,
        Name = user.Name,
        Email = user.Email,
        Role = user.Role,
        IsSuperAdmin = user.IsSuperAdmin,
        Surname = user.Surname,
        PhoneNumber = user.PhoneNumber,
        PhoneVerified = user.PhoneVerifiedAt is not null,
        Country = user.Country,
        City = user.City,
        BirthDate = user.BirthDate,
        ImagePath = user.ImagePath,
        Latitude = user.Latitude,
        Longitude = user.Longitude,
        Plan = user.Plan,
        StorageUsedBytes = user.StorageUsedBytes,
        Coins = user.Coins,
        StorageLimitBytes = StoragePlanLimits.BytesFor(user.Plan),
        MaxLand = PlanLimits.MaxLand(user.Plan),
        MaxLivestockKinds = PlanLimits.MaxLivestockKinds(user.Plan),
        MaxStockKinds = PlanLimits.MaxStockKinds(user.Plan),
        MaxFruitKinds = PlanLimits.MaxFruitKinds(user.Plan),
        BalanceAllowed = PlanLimits.BalanceAllowed(user.Plan),
        EquipmentAllowed = PlanLimits.EquipmentAllowed(user.Plan),
    };
}
