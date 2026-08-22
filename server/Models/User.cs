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

    /// <summary>
    /// Whether this account may use the farm management software at all.
    ///
    /// True for anyone who signed up through it, and false for an account created from the
    /// marketplace's own registration — a shop that sells here has no farm to manage, and giving
    /// it a tenant database it will never open costs a database per seller. Turning it on later is
    /// what grants access; nothing else does.
    ///
    /// Read on every management request rather than carried as a token claim, for the same reason
    /// as <see cref="IsSeller"/>: a week-old token would outlive the change.
    /// </summary>
    public bool HasManagementAccess { get; set; } = true;

    /// <summary>
    /// Whether this account may list on the marketplace. One account, two sides: buying is open to
    /// everyone signed in, and this adds the ability to sell without taking anything away.
    ///
    /// The two registrations are deliberately not symmetric. Signing up in the farm software gets
    /// this for free — a farm has produce to sell, and making them ask again for something they
    /// plainly came for is a step with no decision in it. Signing up on the marketplace gets the
    /// reverse: a seller, and <see cref="HasManagementAccess"/> switched off until an operator
    /// grants it, because a shop has no farm and the software would be empty.
    ///
    /// Kept on the user rather than in a table of its own: there is one seller per account and
    /// nothing to record twice, and every marketplace read already has the user row to hand.
    /// </summary>
    public bool IsSeller { get; set; }

    /// <summary>The name the seller trades under, stamped onto their listings. Distinct from
    /// <see cref="FarmName"/>: a farm and the shop that sells its produce need not be called the
    /// same thing.</summary>
    public string SellerName { get; set; } = string.Empty;

    /// <summary>How buyers reach this seller. Separate from <see cref="PhoneNumber"/>, which is an
    /// identity for signing in rather than a number to publish.</summary>
    public string SellerPhone { get; set; } = string.Empty;

    /// <summary>
    /// The messaging apps a buyer can reach this seller on, each as the handle or number the
    /// seller wants published. Empty means "not offered", which is why they are plain strings
    /// rather than nullables — there is no difference here between unset and declined.
    ///
    /// Kept apart from <see cref="PhoneNumber"/> for the same reason as
    /// <see cref="SellerPhone"/>: that one is an identity for signing in, these are contact
    /// details meant to be shown to strangers.
    /// </summary>
    public string SellerTelegram { get; set; } = string.Empty;
    public string SellerWhatsapp { get; set; } = string.Empty;
    public string SellerFacebook { get; set; } = string.Empty;

    /// <summary>Where the seller trades from, written the way they write it — free text, like
    /// <see cref="MarketListing.Location"/>, rather than a place the app has to know.</summary>
    public string SellerLocation { get; set; } = string.Empty;

    /// <summary>When the account registered as a seller. Null until it does.</summary>
    public DateTime? SellerRegisteredAt { get; set; }

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
