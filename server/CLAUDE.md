# server/ — ASP.NET Core API and database schema

Reference for the backend. The frontends (Expo app at the repo root, React SPA in `web/`) consume
this API; their own conventions are not covered here.

**Stack:** .NET 10 (`net10.0`), ASP.NET Core controllers, EF Core 10 + `Npgsql.EntityFrameworkCore.PostgreSQL`,
JWT bearer auth (BCrypt passwords, Google ID-token sign-in), Swagger in Development.

---

## 1. The one thing to understand first: two databases per request

This is a **database-per-tenant** app. There is no `UserId` column on domain tables — isolation is
physical.

| | `MasterDbContext` | `AppDbContext` |
|---|---|---|
| Database | `master` (single, shared) | `farm_user_{userId}` (one per user) |
| Holds | users, marketplace, neighbours, SMS codes, site visits | everything else (farm domain) |
| Connection | `ConnectionStrings:master` | same host/credentials, `Database=` swapped |
| Migrations | `Migrations/Master/` | `Migrations/Tenant/` |
| Applied when | app startup (`Program.cs`) | end of onboarding (`POST /api/auth/farm`), first farm access, then every login |

Wiring (`Program.cs`, `Services/TenantConnectionProvider.cs`, `Services/CurrentTenant.cs`):

```
HTTP request → JWT → ClaimTypes.NameIdentifier → CurrentTenant.UserId
             → TenantConnectionProvider.GetConnectionString() → "farm_user_{id}"
             → AppDbContext for this scope
```

Consequences that bite:

- **`AppDbContext` throws `InvalidOperationException` when `CurrentTenant.UserId == 0`.** Any
  controller that touches it must be `[Authorize]`. `ProductsController` is not — it is scaffolding
  leftover and will throw if called.
- **The two databases cannot reference each other.** Cross-database links are plain `int` columns,
  never FKs: `StockMovement.MarketListingId`, `TreeStockMovement.MarketListingId`,
  `ProductionMovement.MarketListingId` all point into master's `MarketListings` with no constraint.
  `MarketListing` deliberately snapshots (`SellerName`, `ItemType` as a *name*) instead of pointing
  at tenant rows, whose ids mean nothing outside their own database.
- **`TenantDatabaseProvisioner.ProvisionAsync` is idempotent** — `CREATE DATABASE IF NOT EXISTS`
  (checked via `pg_database`) then `Database.MigrateAsync()`. Logging in (which awaits it) is
  therefore the real way to prove a new tenant migration applies; there is no separate migrate step.
- **A farm database is created only when onboarding is done.** Registering (any route) creates
  the `Users` row and nothing else; `Users.DatabaseCreatedAt` stays null until the database exists.
  Onboarding's last step calls `POST /api/auth/farm` behind a loading screen (the ~100 tenant
  migrations take 10–20 s), then saves what was entered. Login migrates only databases that
  exist. Every run goes through the singleton `Services/TenantProvisioningQueue.cs`, so a login
  or the operator's `migrate` joins a run already in progress instead of racing it; a successful
  run stamps `DatabaseCreatedAt`.
  - Until then, list actions marked `[SeedUntilFarmExists(typeof(T))]` answer from the model's
    `HasData` seed (empty for tables with none) without opening a connection: configurations,
    farms, stocks, livestock, tree stocks and the stock-kind, livestock-kind, fruit-kind and
    production-type catalogs — everything onboarding reads. A new endpoint onboarding reads needs
    the attribute too, or it creates the database early.
  - `TenantReadyInterceptor` sits on `AppDbContext` (it reads the id from the `farm_user_{id}`
    database name): a connection to a farm that doesn't exist yet creates it first, and one that
    arrives during a run waits for it. That on-demand path is how the Expo app, which has no
    onboarding, gets its database. The provisioner and the cross-tenant readers build their own
    options without the interceptor — the provisioner must, or it would wait on itself.
  - The `AddDatabaseCreatedAt` migration stamped every account whose `farm_user_{id}` existed.
    The queue is a hosted service, so a normal shutdown waits for runs in flight.
- **The only cross-tenant read** is `Services/NeighbourTerritoryService.cs`, which opens other
  users' databases directly via `ITenantConnectionProvider.BuildConnectionString(...)` to draw farm
  boundaries on a map. Capped at `MaxFarmers = 60` databases and `RadiusKm = 10`.
- `User.DbName` records the mapping in master so it is visible there and could later diverge from
  `farm_user_{Id}`. Nothing reads it yet — the provider still computes the name from the id.

---

## 2. Layout and layering

```
Controllers/      HTTP + business rules + validation. Thick by design.
Repositories/     EF Core queries; one per aggregate. Interfaces in Repositories/Interfaces/.
Services/         Cross-cutting: tenancy, tokens, plan limits, coins, file storage, territories.
Models/           Entities + DTOs + enums, one type per file. Models/Auth/, Models/Reports/.
Data/             AppDbContext, MasterDbContext, design-time factories, BuiltInKinds seed data.
integrations/     Typed HttpClients: OpenAi (plant scan), WeatherApi, SmsService (smsservice.ge).
Migrations/       Master/ and Tenant/ subfolders — always pass -o and --context.
wwwroot/uploads/  Uploaded images, served by UseStaticFiles at /uploads/{subfolder}/{guid}.{ext}.
```

**Business rules live in controllers, not the database.** Constraints like "exactly one of
`StockId`/`TreeStockId`", "a result may only be written while the harvest is Harvested", "a
realization covers exactly one animal" are enforced in controller code. The schema does not know
them. Read the controller before assuming the DB will protect an invariant.

Repositories are registered `Scoped` in `Program.cs`. Several files hold more than one class —
e.g. `GreenhouseFloorRepository.cs` also defines `GreenhouseSectionRepository` and
`GreenhouseSectionStockRepository`; `GreenhouseStockRepository.cs` also defines
`GreenhouseSeedRepository`. Same for their interface files. Grep, don't glob by filename.

---

## 3. Schema conventions (both databases)

- **No navigation properties anywhere.** Every relationship is configured in `OnModelCreating` as
  `HasOne<Target>().WithMany().HasForeignKey(x => x.Fk)`. There is not a single `.Include(...)` in
  the codebase — repositories join with explicit LINQ joins or two queries. Do not add nav
  properties casually; it changes the generated shadow state and the JSON payloads.
- **Every enum is stored as `text`, not an integer** (`.HasConversion<string>()`), and
  `JsonStringEnumConverter` is registered globally so the wire format uses names too. Renaming an
  enum member is a data migration.
- **`int` identity PKs** (`UseIdentityByDefaultColumn`) named `Id` on every table.
- **All `decimal` columns are bare `numeric`** — no precision/scale is configured anywhere.
- `DateOnly` → `date`, `TimeOnly` → `time without time zone`, `DateTime` → `timestamp with time
  zone`. **Npgsql rejects a `DateTime` whose `Kind` is not `Utc`** for the last of these; controllers
  fix client-sent dates with `DateTime.SpecifyKind(x, DateTimeKind.Utc)` (see
  `AnimalProductionsController.Create`).
- `List<string>` → Postgres `text[]` (`MarketListing.ImagePaths`, `PlantScanHistory.Symptoms` /
  `Treatments` / `PreventionTips`).
- **Catalogs are referenced by name, not by id.** `Stock.Type`, `Seed.Type`, `GreenhouseStock.Type`,
  `GreenhouseSeed.Type` and `LandPlot.Crop` hold a `StockKind.Name`; `TreeStock.Type` holds a
  `FruitKind.Name`; `Livestock.Type` holds a `LivestockKind.Name`. None is a foreign key, so renaming
  or deleting a kind never orphans a row — it only changes what the pickers offer.
- Table names follow the `DbSet` property name: `Livestock` and `Equipment` are **singular** tables;
  the rest are plural (`StockHistories`, `PlantScanHistories`, …).

---

## 4. Master database (`MasterDbContext`)

### `Users`
Identity, profile, plan, quota, coins. Notable columns:

| Column | Notes |
|---|---|
| `Email` | Lower-cased/trimmed on write. **Unique index filtered `"Email" <> ''`** — phone-registered accounts all hold `''`. |
| `PasswordHash` | BCrypt. **Empty string ⇒ Google-only account**; `Login` must reject before `BCrypt.Verify`, which throws on an empty hash. |
| `PhoneNumber` / `PhoneVerifiedAt` / `SignsInWithPhone` | **Unique index filtered `"PhoneVerifiedAt" IS NOT NULL OR "SignsInWithPhone"`** — a number is a sign-in identity when it was registered through `phone/register` (`SignsInWithPhone`, no SMS check) or SMS-verified; otherwise it is a contact detail and may collide. The profile endpoint cannot change a sign-in number. |
| `Role` | `Owner` \| `Member` (text). Everyone self-registering gets `Owner`. Not actually enforced anywhere yet. |
| `DbName` | `farm_user_{Id}`, assigned in `UserRepository.AddAsync` once the identity exists. |
| `Plan` | `Free` \| `Medium` \| `Premium` (text) — see §8. |
| `FreeModule` / `AllModulesIncluded` | The one farm module (`Crop`\|`Livestock`\|`Fruit`\|`Wine`, text) a Free account picked in onboarding through `PUT /api/auth/free-module` — set once; a different value answers 409. `AllModulesIncluded` grandfathers accounts older than modules: the `AddFarmModules` migration set it on every existing row. See §8. |
| `DatabaseCreatedAt` | When `farm_user_{id}` was created — null until the account finishes onboarding (or a client without onboarding first opens it). See §1. |
| `StorageUsedBytes` | Running total maintained by `FileStorageService` on every upload/delete. |
| `Coins`, `WelcomeBonusGrantedAt`, `LastDailyBonusOn` | See §8. |
| `ScanCount`, `LastScanDate` | AI plant-scan daily quota; count resets when the date rolls over. |
| `Latitude` / `Longitude` | `double precision`, nullable — the profile map pin, distinct from farm boundaries. |

**Deleting an account** is the operator's `DELETE /api/admin/users/{id}` (`AdminController.Delete.cs`,
the delete button on `/manager`). Inside one master transaction it removes the row — listings,
neighbour links and coin awards cascade, `SiteVisits.UserId` goes null, `MarketOrders` keep their
plain `SellerId` — and drops `farm_user_{id}` through `TenantDatabaseProvisioner.DropAsync`
(`DROP DATABASE … WITH (FORCE)`); a failed drop rolls the account back. It refuses the caller's
own account and any `IsSuperAdmin` account. Uploaded files are not removed.

**Reading one account's farm** is `GET /api/admin/users/{id}/overview` (`AdminController.Overview.cs`):
farms with plots, stocks, livestock groups and tree stocks, read from that tenant through
`OpenTenantAsync`. It answers `Database: Missing` when there is no `farm_user_{id}` and `Outdated`
when that database has pending migrations — it never migrates on a read; `POST
/api/admin/users/{id}/migrate` does that on the operator's request (the same `ProvisionAsync` a
login runs). `GET /api/admin/users/database-sizes` answers `{ userId: bytes }` for every
`farm_user_*` database (`pg_database_size`); `/manager` fetches it apart from the user list, since
sizing walks each database's files (milliseconds on the Linux server, over a minute on a Windows dev box).

### `MarketListings`
Self-contained snapshot of something offered for sale/rent. `SellerId` → `Users` (cascade).
`Type`/`Category`/`Status` are text enums (`Sale|Rent`, `Stock|TreeStock|Livestock|Equipment|TreeProduct|Other`,
`Active|Completed`). `ItemType` carries a kind *name* for icon/label lookup. `ImagePaths` is `text[]`.
Sales from tenant side call `MarketListingRepository.RestoreAfterSaleAsync` on rollback.

### `Neighbours`
One row per ordered pair. `RequesterId` + `AddresseeId` unique together; `AddresseeId` separately
indexed; both cascade from `Users`. `Status` is `Pending|Accepted` — declining/cancelling/removing
**deletes the row**, which is what lets either side ask again. Both directions existing at once is a
legitimate race, resolved by accepting rather than by refusing the insert.

### `NeighbourCoinAwards`
Outlives the `Neighbour` row it was paid for, so unfriending and re-friending pays once.
`(UserAId, UserBId)` unique, **stored lowest id first** (`CoinService.Pair`); the unique index is the
concurrency guard — `CoinService` catches `DbUpdateException`, detaches and reloads.

### `PhoneVerificationCodes`
`(PhoneNumber, CreatedAt)` index. Stores `CodeHash`, never the digits. Rows are kept after use
because the send-rate limits are counted from them. **Nothing writes to it today**: `POST
/api/auth/phone/register` and `phone/login` (`AuthController.Phone.cs`) take a number and a password
with no SMS code, and there is no send-code route. The table, `PhoneVerificationService` and the SMS
integration remain for when verification is wanted back.

### `SiteVisits`
One row per page view of the web SPA, written by the anonymous `POST /api/visits`
(`VisitsController`, rate-limited to 120/min per IP, open in `ManagementAccessMiddleware`).
`VisitorId` (localStorage) and `SessionId` (30 min idle) are client-generated; `UserId` is set from
the token when one is sent (**SetNull** FK). `Device` is a text enum (`Desktop|Mobile|Tablet|Bot`),
parsed with the browser and OS by `Services/UserAgentParser.cs`; after the location lookup,
`Services/BotSignals.cs` also files as `Bot` a visit that reports `navigator.webdriver`, headless
Chrome's 800×600 screen or `Etc/Unknown` time zone, or a hosting network (Cloudflare, Akamai and
Fastly are left out — they relay iCloud Private Relay users). Reads hide bots unless asked. The IP comes from
`VisitorAddress.Resolve` (`X-Forwarded-For` via `UseForwardedHeaders`, falling back to `X-Real-IP`
behind a loopback proxy), and its location is copied from a row with the same IP in the last 7 days
before `IpGeolocation` is asked. Read only through `GET /api/admin/visits/summary` and
`/api/admin/visits/sessions` (`AdminController.Visits.cs`). Every read leaves out each `VisitorId`
that has ever carried the id of an account in `VisitTracking:ExcludedEmails` (the operator's own
browsing), including that browser's anonymous visits; the rows are still recorded, just never counted.

---

## 5. Tenant database (`AppDbContext`) — 48 tables

### 5.1 Reference / seeded data
Seeded by `HasData`, so it arrives through migrations. `scripts/truncate_tenant.py` preserves these
six tables plus `__EFMigrationsHistory`, because EF will not re-seed a migration it has already run.

| Table | Contents |
|---|---|
| `StockKinds` | `Name` unique. Built-ins 1–12: Weat, Beans, Milk, Cabbage, Cucumber, Eggplant, Potato, Pumpkin, Tomato, Carrot, Corn, Onion. |
| `FruitKinds` | `Name` unique. Built-ins 1–3: Apple, Orange, Banana. |
| `LivestockKinds` | `Name` unique. Built-ins 1–11: Cow, Sheep, Chicken, Turkey, Pig, Cat, Dog, Duck, Goat, Rabbit, Rooster. |
| `ProductionTypes` | 1 Milk, 2 Egg, 3 Wool, 4 Honey, **7 Manure, 8 Silk**. Ids **5 and 6 are deliberately vacant** — they were Meat and Leather, dropped rather than reassigned so old rows keep their meaning. Users can add more. |
| `Units` | 1 Kilogram/kg, 2 Liter/L, 3 Piece/pcs, 4 Gram/g, 5 Dozen/dz. |
| `Configurations` | `Name` unique feature switches, `Value` is 0/1. Seeded: `greenhouse=0`, `CropFarming=1`, `livestock=1`, `fruitstock=1`, `marketplace=1`, `calendar=1`, `winemaking=1` (id 7, also inserted into existing tenants by the `AddWinemaking` migration). New settings ship as new seeded rows, never new columns. |

`Data/BuiltInKinds.cs` is the shared list — both the seeding and the repositories' delete guards read
it, and matching is **by name, case-insensitive** so a restored/re-seeded database still works. The
lists are effectively frozen: adding an entry there does not reach existing tenants without a
migration.

### 5.2 Land
- **`Farms`** — `Name`, `ImagePath`, `Area`, `Location`, and `Boundary`: a JSON string of
  `[[lat,lng],…]` kept as text, not a geometry column (nothing queries it spatially).
  `null` = client said nothing; `[]` = owner cleared it deliberately.
- **`LandPlots`** — `FarmId` (cascade), `Area`, `Crop`, plus what grows there: `TreeStockId`
  (**real FK, SetNull**) *or* `StockId` (**plain nullable int — no FK, no index**). Never both.

### 5.3 Livestock
- **`Livestock`** — the *group/herd*. `Type` (LivestockKind name, settled at creation), `Count`,
  `Name`, `FarmId` (cascade), `IsDeleted`.
  - `ProductionTypeId` (Restrict) — what the herd produces, declared once and then settled.
  - `MeatProductionTypeId` (Restrict) — a `ProductionType` named after the group, so one herd's meat
    is distinguishable from another's. **The client creates it**, not the server: it `POST`s the
    group's name to `/api/productiontypes` (idempotent — an existing name returns the existing row)
    and then PUTs the group with the id, at group creation and again lazily at realization if the
    group has none. Nothing enforces one-meat-type-per-group, so two groups *can* share a row.
- **`LivestockDetails`** — the individual animal. `LivestockId` (cascade), `Code` (ear tag),
  `ImagePath`, `BornDate`, `Gender` (`Male|Female`, text), `ParentOneId` / `ParentTwoId`
  (self-FK, **SetNull** — losing a parent must not delete the offspring). `MarketOrderId` (bare int →
  master `MarketOrders`) is set while a per-animal sale holds the animal and `SoldOn` while it is
  applied; such an animal refuses edit, delete and realization (409), is skipped by
  `RemoveUnreferencedAsync`, and is absent from `GET /api/livestockdetails/available`.
- **`LivestockMovements`** — head-count ledger. `LivestockId` (cascade), `Delta`, `Date`, `Note`,
  `Source` ∈ `Manual|Birth|Gift|Purchase|Realization|Market`, `MarketOrderId` (bare int, set on the
  entries a per-animal sale wrote). **The group's opening count is written as the
  first `Manual` movement, not set on the row** (`LivestockController.Create` zeroes `Count`, logs
  the movement, then also creates that many `LivestockDetails` with codes like `C-1`).
  `Realization` and `Market` entries are refused by `DELETE` — they go with their record or sale.
- **Per-animal sales** — `POST /api/marketsales/manual` with `AnimalIds` stores the order as
  `SourceKind = Livestock`, `SourceId = null`, `Quantity` = the animal count. The order is saved
  first, then `MarketSaleInventoryService.ReserveAnimalsAsync` stamps the animals with one conditional
  `ExecuteUpdate` (a lost race undoes it and answers 409), and applying writes one `Market` movement
  per herd. Reversing removes those movements and clears `SoldOn`; deleting the sale also releases
  `MarketOrderId`.
- **`BreedingEvents`** — `LivestockId`, `MaleAnimalId`, `FemaleAnimalId` all nullable and **all
  SetNull**: the event outlives what it points at, and SetNull also stops the group→detail cascade
  reaching in by a second path. `Status` ∈ `Breeding|PregnancyConfirmed|Completed|Failed`, each stage
  stamping its own date column. `OffspringCount` is written once from the single recorded result
  (offspring can be a head count with no rows to count).
- **`MedicalRecords`** — vet visit for one animal. ⚠️ **`StockId` → `LivestockDetails.Id`**, cascade.
- **`StockHistories`** — an animal's *weight* readings over time. ⚠️ **`StockId` →
  `LivestockDetails.Id`**, cascade. Nothing to do with `Stocks`.
- **`StockFeeds`** — join: `LivestockId` (cascade) × `StockId` (**here it really is `Stocks`**,
  cascade) + `Amount`.
- **`AnimalProductions`** — one collection batch. Exactly one of `AnimalId` (→ LivestockDetails,
  cascade) or `LivestockId` (→ Livestock, cascade). `ProductionTypeId`/`UnitId` are Restrict.
  `AnimalCount`, `CollectionDate`, `Quantity`, `Quality`, `PricePerUnit`, `TotalPrice`, `CollectedBy`,
  `BatchNumber`, `Notes`. **`IsRealization`** marks a slaughtered animal: always `AnimalCount = 1`,
  always against an `AnimalId`, at most one per animal, filed under the group's
  `MeatProductionTypeId` rather than its `ProductionTypeId` — and the group's `Count` is left alone.
- **`ProductionMovements`** — the *deduction* ledger for production balances, keyed by
  `(ProductionTypeId, UnitId)` — the same pair a balance is computed per, since litres and pieces
  cannot be summed. `Delta` negative for a sale, `Source` ∈ `Manual|Market`, `MarketListingId` a
  bare int. Collections only ever add (through `AnimalProductions`); a realization's meat is **not**
  mirrored here or it would count twice.

### 5.4 Crop stock and seed
- **`Stocks`** — a good held. `Type` (StockKind name), `Name` (optional label), `Amount`,
  `Unit` ∈ `Kilogram|Quantity|Liter|Plant` (text), `IsDeleted`, and `Category` ∈ `Crop|Wine` (text,
  default `Crop`, settled at creation). `Wine` is the winemaking module's vines: the same table and
  machinery as crop stock, but always `Type` `Grape` (`Stock.WineType`) and `Plant` (ძირი) — create
  and update coerce both — and **no seed**: wine stock is created through `POST /api/stocks` only
  (`with-seed` is crop-only) and a wine harvest records no `HarvestSeeds`. Each wine stock owns one `TreeProduct` (`Stock.TreeProductId`, unique, SetNull; `TreeProduct.Category = Wine`, kg), created with the stock (`WineProductLink`) and renamed with it — that product's ledger is the wine balance page. Fruit pages ask `GET /api/treeproducts?category=Fruit`. `GET /api/stocks` takes
  `?category=`; plan caps count per category.
- **`Seeds`** — sowing input, deliberately separate from `Stocks`. `Type` is a **StockKind** name so
  seed and produce share a catalog. `Unit` ∈ `Kilogram|Gram|Quantity`. `IsDeleted`.
  Created together with its stock by `POST /api/stocks/with-seed`, and soft-deleted with it —
  matched **by `Type` + `Name`**, since there is no key between them, and kept if another live crop
  stock still holds that crop+label.
- **`StockMovements`** — `StockId` (cascade), `Delta`, `Source` ∈ `Manual|Harvest|Market`,
  `HarvestItemId` (cascade), `HarvestResultId` (cascade), `MarketListingId` (bare int).
- **`SeedMovements`** — `SeedId` (cascade), `HarvestSeedId` (cascade), `Delta`,
  `Source` ∈ `Manual|Harvest`.
- **`StockPhotos`** — `StockId` (cascade), `ImagePath`, `TakenAt` (`date`, may differ from
  `CreatedAt`, the upload time).

### 5.5 Fruit / orchard
- **`TreeStocks`** — an orchard. `Type` (FruitKind name), `Name`, `Amount`,
  `Unit` ∈ `Kilogram|Box|Plant` (**new entries are always `Plant`** — "ძირი", a tree count; the other
  two exist only for older rows), `LandPlotId` (cascade), `IsDeleted`, and
  `TreeProductId` (**SetNull**) with a **unique index filtered `"TreeProductId" IS NOT NULL`** — one
  product comes off exactly one orchard. Required on create; on update, omitting it means "keep".
- **`TreeStockMovements`** — mirror of `StockMovements` for orchards: `TreeStockId` (cascade),
  `HarvestItemId`, `HarvestResultId`, `MarketListingId`, `Delta`, `Source` (reuses `StockMovementSource`).
- **`TreeProducts`** — standalone catalog of what trees yield. `Name`,
  `Unit` ∈ `Kilogram|Box|Quantity` (text).
- **`TreeProductMovements`** — `TreeProductId` (cascade), `HarvestProductId` (cascade), `Delta`,
  `Source` ∈ `Manual|Harvest|Market`. Read through `TreeProductMovementDto`, which resolves the
  **harvest's own date** — the row's `CreatedAt` is only when it was written and moves again whenever
  a harvest is re-marked harvested.

### 5.6 Harvests (field and orchard)
`Harvests` — `Title`, `Date`, `Status` ∈ `Planning|Planting|Harvested`, `Kind` ∈ `Crop|Fruit|Wine` (`Wine` follows every crop rule),
`ExpectedHarvestDate` (the plan; `Date` is the record date and what reporting groups by),
`FarmId` (cascade), `LandPlotId` (cascade), `EquipmentCost`/`WorkersCost`/`FuelCost`/`OtherCost`,
`Revenue` — all money nullable.

| Child table | Belongs to | Meaning |
|---|---|---|
| `HarvestItems` | `HarvestId` cascade + exactly one of `StockId`/`TreeStockId` (both cascade) | **Planned** amount. `Unit` is a free string (a `StockUnit` *or* `TreeStockUnit` name); blank falls back to the target's own unit. **Moves no balance.** |
| `HarvestResults` | same shape | **Actual** yield. The only thing that moves stock, and only while the harvest is `Harvested`. |
| `HarvestSeeds` | `HarvestId` + `SeedId`, both cascade | Seed sown. Adding one deducts the seed and writes the owning `SeedMovement`. |
| `HarvestTrees` | `HarvestId` + exactly one of `TreeStockId` (fruit) / `StockId` (wine vines), all cascade | Trees or vines picked (`Amount`) and produce taken off them (`HarvestedAmount`; kg of grapes for wine, booked to the vineyard's own grape `TreeProduct` exactly as fruit is to its orchard's). Picking **consumes nothing** — the plants are still standing. A `Wine` harvest works like `Fruit`: one vineyard per harvest, no results, no seed. |
| `HarvestChemicals` | `HarvestId` cascade | `Name`, `Date`, `Cost`. Folds into expenses, moves no balance. |
| `HarvestProducts` | `HarvestId` cascade + `TreeProductId` **Restrict** | A fruit harvest's yield, booked against the tree's product rather than into plant `Stock`. Restrict is why deleting a referenced `TreeProduct` returns a conflict rather than a 500. |

### 5.7 Greenhouse (parallel universe, gated by `Configuration greenhouse`)
Its own tables throughout — a greenhouse harvest belongs to a greenhouse rather than a farm or plot,
so it shares none of `Harvest`'s machinery. It reuses `StockKind` names, `StockUnit`, `SeedUnit` and
`HarvestStatus`.

- **`Greenhouses`** — `Name`, `ImagePath`, `Area`, `EstablishDate`, `Location`, and
  `Width`/`Length`/`Height` used as the coordinate system for the layout editor. **0 means "not
  configured"** and boundary checks are skipped while any dimension is 0.
- **`GreenhouseFloors`** (cascade from greenhouse) → **`GreenhouseSections`** (cascade from floor):
  `X`, `Y`, `Width`, `Height`, `Rotation` (degrees clockwise about the section's own centre).
- **`GreenhouseSectionStocks`** — pure many-to-many join, both sides cascade; purely descriptive.
- **`GreenhouseStocks`** / **`GreenhouseSeeds`** / **`GreenhouseHarvests`** — all `GreenhouseId`
  with **`DeleteBehavior.Restrict`**: `GreenhousesController` refuses to delete a greenhouse that
  still has any, so rows can't vanish under the pages showing them.
- **`GreenhouseHarvestItems`** (planned) / **`GreenhouseHarvestResults`** (actual) — cascade from
  both the harvest and the greenhouse stock. **`GreenhouseHarvestSeeds`** deducts the seed but,
  unlike the field version, writes **no movement row** — greenhouse seed has no ledger.
  **`GreenhouseHarvestChemicals`** mirrors `HarvestChemicals`.
- `GreenhouseHarvestSummary` (`GET /api/greenhouseharvests/summaries`) bundles a harvest with its
  results so a page is one request instead of one per row.

### 5.8 Standalone
- **`CalendarEvents`** — `Title`, `Date` (`date`), `Time` (`time without time zone`).
- **`Equipment`** — `Name`, `Quantity`, `ImagePath`. Gated: not available on the Free plan.
- **`PlantScanHistories`** — one saved OpenAI plant-scan result. `Symptoms`, `Treatments`,
  `PreventionTips` are `text[]`.
- **`Products`** — scaffolding leftover from the template. `ProductsController` has no `[Authorize]`
  and will therefore throw when it resolves `AppDbContext`. Not part of the domain.

---

## 6. Ledger invariants

Balances are duplicated: an entity carries an `Amount`/`Count`, and a movement table explains how it
got there. **They must never disagree** — that is what most of the controller logic is protecting.

- Only `HarvestResult` contributes to stock, and only while `Harvest.Status == Harvested`.
  A `HarvestItem` is a forecast and adds nothing however the harvest ends up.
- `Repositories/HarvestStockSync.cs` (`IHarvestStockSync`) is the **single place** those two rules
  are applied. It *reconciles* rather than applies/undoes: it computes what the harvest should be
  contributing, diffs it against the movements already carried, and moves only the difference —
  which is why one row keeps exactly one movement as amounts change, and why calling it twice is
  harmless. Call `SyncAsync(harvestId)` after anything that could change the answer (status, plan,
  result); `SyncAsync(harvestId, excludeResultId)` before deleting a result (its movement must come
  off the books while the row still exists, since the cascade would otherwise take it away without
  refunding); `ClearAsync(harvestId)` before deleting a harvest.
  It still reads planned items — movements one of them wrote under the *old* rule are found through
  them and reversed.
- Movements sourced from a harvest are **refused** by the plain delete endpoints
  (`DELETE /api/stockmovements/{id}` → 400) because they belong to their harvest row.
- Deleting a manual/market movement reverses its delta and, if it carries a `MarketListingId`, calls
  `RestoreAfterSaleAsync` to put the listing back. A listing since edited or deleted is left alone —
  failing there would strand the caller.
- Every sale endpoint re-checks availability **server-side** (`Quantity > Amount` → 409) even though
  the client checks too: two concurrent sales would both pass the client check and overdraw.
  Same guard on `/api/stocks/{id}/sale`, `/api/treestocks/{id}/sale`, `/api/productionmovements/sale`,
  `/api/treeproductmovements/sale`.

### Soft delete
`Stock`, `Seed`, `TreeStock`, `Livestock` carry `IsDeleted` and are **never hard-deleted**. Their
harvest rows, movements, photos, feeds, plots and production history all cascade off them, so a real
delete would rewrite what past harvests and reports say happened — while any sale already deducted
would survive, leaving uncorrectable negative balances. A soft-deleted row:
- is dropped from list endpoints and every picker (`?includeDeleted=true` brings it back for pages
  that must name a historical reference),
- refuses further edits and sales (409),
- no longer counts toward plan limits.

A deleted `Livestock` group also refuses **new records under it** — movements, animals,
production, breeding events and results, medical, weight and feed rows all answer 409 with
`LivestockController.DeletedMessage`, checked through `ILivestockRepository.IsDeletedAsync`
(which takes a group id and/or animal ids). A removed herd stops counting toward the cap, so
without this it kept working as a free extra herd.

---

## 7. API conventions

- `[ApiController]` + `[Route("api/[controller]")]` + `[Authorize]` on every controller except
  `AuthController` (mixed), `VisitsController` (anonymous beacon) and `ProductsController` (broken,
  see above).
- Routes are the controller name lower-cased: `FarmsController` → `/api/farms`,
  **`LivestockController` → `/api/livestock`** (not `livestocks`), `EquipmentController` →
  `/api/equipment`, `StockHistoryController` → `/api/stockhistory`.
- Child collections are fetched by query string, not nested routes:
  `GET /api/harvestitems?harvestId=`, `GET /api/greenhousefloors?greenhouseId=`,
  `GET /api/livestockdetails?livestockId=`, `GET /api/stockhistory?stockId=` (**an animal id**).
- `?includeDeleted=false` on `/api/stocks`, `/api/seeds`, `/api/treestocks`, `/api/livestock`.
- Status codes: `409 Conflict` for a settled/derived-state violation, `400` for validation,
  **`402 Payment Required` exclusively for plan limits** — clients watch for it to show the upgrade
  sheet, which they cannot distinguish from an ordinary 400.
- Image upload is a separate `POST .../upload-image` (`multipart/form-data`,
  `[RequestSizeLimit(25_000_000)]`) returning `{ imagePath }`; the caller then PUTs the entity with
  that path. `FileStorageService` allows `.jpg .jpeg .png .webp` only, writes
  `wwwroot/uploads/{subfolder}/{guid}{ext}`, and keeps `User.StorageUsedBytes` in step both ways.
- CORS policy `ExpoClient` is wide open (`AllowAnyOrigin/Method/Header`).
- JWT claims: `NameIdentifier` = user id (**the tenant selector**), `Email`, `Name`, `Role`.
  Default lifetime 10080 minutes (7 days) from `Jwt:ExpiryMinutes`.

### Reports (`/api/reports`)
`stock-movements` (gated by `EnsureBalanceAllowedAsync`), `overview`, `day`, `series`. All take
`category` ∈ `Crop|Livestock|Fruit|Greenhouse`; `overview`/`series` also bind a `ReportPeriod`
(`Mode` ∈ `All|Year|Quarter|Custom` plus `Year`/`Quarter`/`From`/`To`) straight from the query
string. Everything compares as a calendar day — no timezone conversion enters the aggregation.
Payloads carry **raw catalog names, never display text**: the client owns translations and artwork
(`ReportSeries.Kind` ∈ `stock|tree|treeProduct|productionType`; `ReportGood.Kind` adds `seed`).
`ReportRepository` is one `partial class` spread over three files — `ReportRepository.cs` (stock
movements), `ReportAggregationRepository.cs` (the totals), `ReportDetailsRepository.cs` (the two
drill-downs).

---

## 8. Plans, quotas and coins

`Models/PlanLimits.cs` + `Models/StoragePlan.cs`, enforced by `Services/PlanLimitService.cs` (throws
`InvalidOperationException`, which controllers translate to 402). Every limit is also echoed into
`UserDto` so the client can render "what your plan allows" without duplicating the numbers.

| | Free | Medium | Premium |
|---|---|---|---|
| Storage | 50 MB | 300 MB | unlimited |
| Land plots | 1 | 3 | unlimited |
| Livestock kinds | 3 | 5 | unlimited |
| Stock kinds | 3 | 5 | unlimited |
| Fruit kinds | 3 | 5 | unlimited |
| AI scans / day | 1 | 5 | unlimited |
| Equipment | ✗ | ✓ | ✓ |
| Balance report | ✓ | ✓ | ✓ | 

`BalanceAllowed` returns `true` for every plan today; the gate is kept as the one seam to
re-restrict from. Note the two-tier check: `EnsureCanAddX` (`>=` limit → refuse) guards *creation*,
`EnsureXWithinLimit` (`>` limit → refuse) guards *edits*, so someone exactly at their cap — or over
it after a downgrade — can still maintain what they have.

**Modules.** The farm is four modules — `Crop`, `Livestock`, `Fruit`, `Wine` (`Models/FarmModule.cs`). A
Free account gets only the one it chose in onboarding; Medium and Premium get all four, and so does
any account with `AllModulesIncluded`. `Models/ModuleAccess.cs` is the rule, echoed in `UserDto` as
`AllowedModules` and `NeedsModuleChoice` (Free, farm access, nothing chosen, not grandfathered).
Creating a module's root row — a stock (both routes), a herd, an orchard — calls
`EnsureModuleAllowedAsync` before the cap check and answers 402. An account that still needs a choice
claims the module there instead (same set-once update as the endpoint) — that is how the Expo app,
which has no choice step, gets one. Rows already in a module stay editable after a downgrade; the web
client locks the module's pages instead.

A "kind" is one live row — each `Stock`, `TreeStock` or `Livestock` group counts once, and
soft-deleted rows (and removed farms, for land) never count. New accounts start on `Free` (the
`User.Plan` default; no registration path sets it). **Only a superuser changes a plan**:
`PUT /api/admin/users/{id}/plan` (`AdminController.Plans.cs`) re-reads `IsSuperAdmin` like every
admin action and answers 403 otherwise. There is no self-service upgrade and no payment
integration. A client sees a new plan on its next `POST /api/auth/daily-bonus`, which returns the
current `UserDto` whether or not a bonus was paid.

**Every capped create takes a per-tenant lock before it counts**:
`IPlanLimitLock.AcquireAsync(PlanResource.X)` opens a transaction and calls
`pg_advisory_xact_lock`, which Postgres scopes to the tenant's own database, and the controller
commits after the insert. Without it, requests fired together each counted the same rows and all
passed — ten parallel stock creates on Free made ten stocks. It covers farm create and restore,
stock (both routes), fruit, livestock, and the shared greenhouse stock/seed allowance. A new create
path that a cap guards has to do the same.

`Services/CoinService.cs`: `WelcomeBonus = 50` (once ever, guarded by `User.WelcomeBonusGrantedAt`),
`NeighbourBonus = 100` to both sides (once per pair ever, guarded by the `NeighbourCoinAwards`
unique index), `DailyBonus = 10` (once per **UTC** calendar day, guarded by a conditional
`ExecuteUpdateAsync` on `LastDailyBonusOn` — which writes past the change tracker, hence the
`ReloadAsync`). The daily bonus has its own route `POST /api/auth/daily-bonus` because a 7-day token
means most users pass through `Login` roughly weekly.

---

## 9. Running, migrating, operating

See also `.claude/skills/verify/SKILL.md` at the repo root.

```bash
cd server && dotnet run --urls http://localhost:5261     # launchSettings default is 0.0.0.0:5261
```

Postgres must be at `localhost:5432` (`postgres`/`123` in `appsettings.json`). Both frontends
default to `http://localhost:5261`.

```bash
# tenant schema — note BOTH flags, they are not optional
dotnet ef migrations add <Name> --context AppDbContext    -o Migrations/Tenant
dotnet ef migrations add <Name> --context MasterDbContext -o Migrations/Master
```

- `Server.exe` left running from a previous session locks the build output — `dotnet build`/`dotnet ef`
  fails with MSB3027. Check `tasklist //FI "IMAGENAME eq Server.exe"` and ask before killing it.
- The design-time factory targets `farm_user_template` unless a database name is passed as the first
  argument. Tenant migrations reach real users only when each of them next logs in.
- **Review EF's generated `defaultValue`s by hand.** Its automatic choices (`0` for a new
  non-nullable int, etc.) are frequently wrong for backfilling existing tenant rows.
- **Adding a unique index to a live tenant database usually needs a filter.** Both existing examples
  do exactly that — `Users.Email` (`<> ''`), `Users.PhoneNumber` (`PhoneVerifiedAt IS NOT NULL OR SignsInWithPhone`),
  `TreeStocks.TreeProductId` (`IS NOT NULL`) — because pre-existing rows would otherwise collide.
- `scripts/truncate_tenant.py --email <addr>` empties one tenant, keeping `__EFMigrationsHistory`
  and the six seeded catalogs (see §5.1). Dry-run by default; `--yes` to execute. Reads the table
  list from the live database, so new tables are handled without touching the script.
- `.github/workflows/deploy.yml` — every push to `main` SSHes to the box and rebuilds there
  (`dotnet publish` + `vite build`). Health check expects `/` → 200 and `/api/farms` → **401**
  (401 is the healthy answer: it proves auth is enforced).

### External integrations (`integrations/`, keys in `appsettings*.json` / user secrets)
| Section | Used by | Notes |
|---|---|---|
| `WeatherApi` | `GET /api/weather` | weatherapi.com, 10 s timeout, defaults to Tbilisi. |
| `OpenAi` | `POST /api/plantscan/analyze` | `gpt-4o-mini`, 60 s timeout; results saved to `PlantScanHistories`; quota-metered per plan. |
| `SmsService` | phone verification | smsservice.ge (`bi.msg.ge`), 15 s timeout. **Currently unused** — phone sign-up does not send codes. |
| `Google:ClientId` | `POST /api/auth/google` | ID token verified against Google's keys with this as audience; unverified email is rejected. |
| `IpGeolocation` | `POST /api/visits` | ipwho.is, no key, 1,000 lookups/day free, 5 s timeout; `Enabled: false` turns lookups off. Private/loopback IPs are never sent. |

---

## 10. Traps

1. **`StockId` means two different things.** On `MedicalRecord` and `StockHistory` it is a
   `LivestockDetail` (an animal). On `StockFeed`, `StockMovement`, `StockPhoto`, `HarvestItem` and
   `HarvestResult` it is a `Stock` (a good). Check the entity before writing a join.
2. `HarvestItem` never moves a balance. If a change to stock is expected, it comes from
   `HarvestResult` + `HarvestStockSync`, and only at `Harvested`.
3. Nothing in the tenant database identifies the tenant. If a query returns another user's row,
   the connection was resolved wrong — look at `CurrentTenant`/`TenantConnectionProvider`, not at a
   missing `WHERE`.
4. `ProductionType` ids 5 and 6 do not exist. Never reuse them.
5. Enum members are persisted by name. Renaming one silently orphans existing rows.
6. Kind names, not ids, are the reference for stocks/seeds/fruits/livestock. A "foreign key" to
   `StockKinds` does not exist and should not be added — several features rely on rows surviving a
   kind's removal.
7. `Livestock.Type`, `Livestock.ProductionTypeId` and `TreeStock.TreeProductId` (once harvested) are
   **settled after creation** — the update endpoints return 409, and an omitted field means "keep",
   never "clear". `Livestock.Name` and `Livestock.Count` are settled too but are **silently ignored**
   rather than refused, because clients legitimately PUT the whole group to change something else
   and carry those along without meaning anything by them. `Count` only ever moves through
   `AdjustCountAsync`, which clamps at 0 (a herd stuck at zero is recoverable; a negative one is not).
8. Deleting a `Farm` cascades to its `Livestock`, `LandPlots` and `Harvests`; deleting a `Livestock`
   group would cascade to its details, movements, breeding events and all production — which is
   exactly why it is soft-deleted instead.
