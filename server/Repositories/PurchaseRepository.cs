using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class PurchaseRepository(AppDbContext context) : IPurchaseRepository
{
    public async Task<IEnumerable<PurchaseDocumentDto>> GetAllAsync()
    {
        var documents = await context.PurchaseDocuments
            .AsNoTracking()
            .OrderByDescending(d => d.Date)
            .ThenByDescending(d => d.Id)
            .ToListAsync();

        var ids = documents.Select(d => d.Id).ToList();
        var items = await context.PurchaseItems
            .AsNoTracking()
            .Where(i => ids.Contains(i.PurchaseDocumentId))
            .OrderBy(i => i.Id)
            .ToListAsync();

        return documents.Select(document => ToDto(document, items)).ToList();
    }

    public async Task<PurchaseDocumentDto?> GetByIdAsync(int id)
    {
        var document = await context.PurchaseDocuments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
        if (document is null)
        {
            return null;
        }

        var items = await context.PurchaseItems
            .AsNoTracking()
            .Where(i => i.PurchaseDocumentId == id)
            .OrderBy(i => i.Id)
            .ToListAsync();

        return ToDto(document, items);
    }

    public async Task<PurchaseDocument?> GetDocumentAsync(int id)
    {
        return await context.PurchaseDocuments.AsNoTracking().FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<List<PurchaseItem>> GetItemsAsync(int documentId)
    {
        return await context.PurchaseItems
            .AsNoTracking()
            .Where(i => i.PurchaseDocumentId == documentId)
            .OrderBy(i => i.Id)
            .ToListAsync();
    }

    public async Task<PurchaseDocument> AddDocumentAsync(PurchaseDocument document)
    {
        context.PurchaseDocuments.Add(document);
        await context.SaveChangesAsync();
        return document;
    }

    public async Task AddItemsAsync(List<PurchaseItem> items)
    {
        context.PurchaseItems.AddRange(items);
        await context.SaveChangesAsync();
    }

    public async Task UpdateDocumentAsync(PurchaseDocument document)
    {
        var existing = await context.PurchaseDocuments.FindAsync(document.Id);
        if (existing is null)
        {
            return;
        }

        existing.Seller = document.Seller;
        existing.Date = document.Date;
        existing.Note = document.Note;
        await context.SaveChangesAsync();
    }

    public async Task DeleteItemsAsync(int documentId)
    {
        var items = await context.PurchaseItems.Where(i => i.PurchaseDocumentId == documentId).ToListAsync();
        if (items.Count == 0)
        {
            return;
        }

        context.PurchaseItems.RemoveRange(items);
        await context.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var existing = await context.PurchaseDocuments.FindAsync(id);
        if (existing is null)
        {
            return false;
        }

        context.PurchaseDocuments.Remove(existing);
        await context.SaveChangesAsync();
        return true;
    }

    private static PurchaseDocumentDto ToDto(PurchaseDocument document, List<PurchaseItem> allItems)
    {
        var items = allItems.Where(i => i.PurchaseDocumentId == document.Id).ToList();
        return new PurchaseDocumentDto
        {
            Id = document.Id,
            Seller = document.Seller,
            Date = document.Date,
            Note = document.Note,
            CreatedAt = document.CreatedAt,
            Total = items.Sum(i => i.Price),
            Items = items,
        };
    }
}
