namespace Server.Models;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;

    /// <summary>
    /// Platform operator: sees the manager page, and approves premium listing requests.
    ///
    /// Distinct from <see cref="Role"/>, which is a role *within a tenant* (Owner/Member) and says
    /// nothing about the platform. Checked against this column on every admin request rather than
    /// carried in the JWT: tokens last a week, so a claim would leave a revoked operator with
    /// access for days after the column was cleared.
    /// </summary>
    public bool IsSuperAdmin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// The Postgres database holding this user's own data (<c>farm_user_{Id}</c>). Recorded rather
    /// than only derived, so the mapping is visible in the master database and a user could later
    /// be moved to a differently-named database without the name having to follow their id.
    /// Assigned by <see cref="Repositories.UserRepository.AddAsync"/> once the id exists.
    /// </summary>
    public string DbName { get; set; } = string.Empty;

    // Private/profile information — set via ProfileController-style endpoints on AuthController,
    // never at registration, so all default to empty/null. The one exception is PhoneNumber, which
    // an account registered by phone arrives with (see AuthController's phone/register).
    public string Surname { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;

    /// <summary>
    /// When an SMS code proved this number belongs to whoever holds the account, or null if nobody
    /// ever has. It is what separates an identity from a contact detail: only a verified number is
    /// unique across users and can be signed in with, so a number merely typed into the profile
    /// screen never becomes a way in.
    /// </summary>
    public DateTime? PhoneVerifiedAt { get; set; }
    public string Country { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string ImagePath { get; set; } = string.Empty;

    public string FarmName { get; set; } = string.Empty;
    public string FarmImagePath { get; set; } = string.Empty;

    /// <summary>Precise farm location the user pinned on the map, if any.</summary>
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }

    /// <summary>Image-upload storage tier; caps <see cref="StorageUsedBytes"/> (see <see cref="StoragePlanLimits"/>).</summary>
    public StoragePlan Plan { get; set; } = StoragePlan.Free;

    /// <summary>Running total of bytes used by this user's uploaded images, updated by <see cref="Services.FileStorageService"/>.</summary>
    public long StorageUsedBytes { get; set; }

    /// <summary>Coins earned so far — see <see cref="Services.CoinService"/> for what pays out.</summary>
    public int Coins { get; set; }

    /// <summary>
    /// When the one-off joining bonus was paid, or null if it hasn't been. Stamped rather than
    /// inferred from <see cref="CreatedAt"/>, so accounts that predate the coin system are paid
    /// once on their next sign-in and never again.
    /// </summary>
    public DateTime? WelcomeBonusGrantedAt { get; set; }

    /// <summary>
    /// The UTC day the daily sign-in bonus was last paid for, or null if it never has been. A date
    /// rather than a timestamp: the bonus is once per calendar day, so "have they been paid today"
    /// is the only question ever asked of it. Same shape as <see cref="LastScanDate"/>.
    /// </summary>
    public DateOnly? LastDailyBonusOn { get; set; }

    /// <summary>Number of AI plant scans used on <see cref="LastScanDate"/>; resets when the date rolls over.</summary>
    public int ScanCount { get; set; }

    /// <summary>The date <see cref="ScanCount"/> was last reset/incremented on, or null if never scanned.</summary>
    public DateOnly? LastScanDate { get; set; }
}
