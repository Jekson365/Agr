using Server.Data;
using Server.Models;

namespace Server.Repositories;

public static class WineProductLink
{
    public static string NameOf(Stock stock) =>
        string.IsNullOrWhiteSpace(stock.Name) ? Stock.WineType : stock.Name.Trim();

    public static async Task<int?> EnsureAsync(AppDbContext context, int stockId)
    {
        var stock = await context.Stocks.FindAsync(stockId);
        if (stock is null || stock.Category != StockCategory.Wine)
        {
            return null;
        }
        if (stock.TreeProductId is int existing)
        {
            return existing;
        }

        var product = new TreeProduct
        {
            Name = NameOf(stock),
            Unit = TreeProductUnit.Kilogram,
            Category = TreeProductCategory.Wine,
        };
        context.TreeProducts.Add(product);
        await context.SaveChangesAsync();

        stock.TreeProductId = product.Id;
        await context.SaveChangesAsync();
        return product.Id;
    }

    public static async Task RenameAsync(AppDbContext context, Stock stock)
    {
        if (stock.TreeProductId is not int productId)
        {
            return;
        }
        var product = await context.TreeProducts.FindAsync(productId);
        if (product is null || product.Name == NameOf(stock))
        {
            return;
        }
        product.Name = NameOf(stock);
        await context.SaveChangesAsync();
    }
}
