using Server.Models;

namespace Server.Data;

/// <summary>
/// The kind catalogs every tenant database is seeded with. Declared here rather than inline in
/// <see cref="AppDbContext.OnModelCreating"/> because two places need the same list: the seeding
/// itself, and the delete guards in the kind repositories. A built-in is what a fresh farm starts
/// from, so it is offered everywhere but never deletable — a user may add kinds of their own and
/// remove those freely.
/// </summary>
/// <remarks>
/// These rows are already written into the migrations, so the lists are effectively frozen:
/// adding an entry here does not reach an existing tenant without a migration of its own.
/// </remarks>
public static class BuiltInKinds
{
    public static readonly StockKind[] Stock =
    [
        new() { Id = 1, Name = "Weat" },
        new() { Id = 2, Name = "Beans" },
        new() { Id = 3, Name = "Milk" },
        new() { Id = 4, Name = "Cabbage" },
        new() { Id = 5, Name = "Cucumber" },
        new() { Id = 6, Name = "Eggplant" },
        new() { Id = 7, Name = "Potato" },
        new() { Id = 8, Name = "Pumpkin" },
        new() { Id = 9, Name = "Tomato" },
        new() { Id = 10, Name = "Carrot" },
        new() { Id = 11, Name = "Corn" },
        new() { Id = 12, Name = "Onion" },
    ];

    public static readonly FruitKind[] Fruit =
    [
        new() { Id = 1, Name = "Apple" },
        new() { Id = 2, Name = "Orange" },
        new() { Id = 3, Name = "Banana" },
    ];

    // The former AnimalType enum members, now an editable catalog like the stock kinds.
    public static readonly LivestockKind[] Livestock =
    [
        new() { Id = 1, Name = "Cow" },
        new() { Id = 2, Name = "Sheep" },
        new() { Id = 3, Name = "Chicken" },
        new() { Id = 4, Name = "Turkey" },
        new() { Id = 5, Name = "Pig" },
        new() { Id = 6, Name = "Cat" },
        new() { Id = 7, Name = "Dog" },
        new() { Id = 8, Name = "Duck" },
        new() { Id = 9, Name = "Goat" },
        new() { Id = 10, Name = "Rabbit" },
        new() { Id = 11, Name = "Rooster" },
    ];

    /* Matched by name, not by id: a name is what the rest of the schema references a kind by, and
       it is what survives a tenant database restored or re-seeded under different ids. */
    public static bool IsStock(string name) => Contains(Stock.Select(k => k.Name), name);

    public static bool IsFruit(string name) => Contains(Fruit.Select(k => k.Name), name);

    public static bool IsLivestock(string name) => Contains(Livestock.Select(k => k.Name), name);

    private static bool Contains(IEnumerable<string> names, string name) =>
        names.Any(n => string.Equals(n, name, StringComparison.OrdinalIgnoreCase));
}
