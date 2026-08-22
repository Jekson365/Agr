using Server.Models;

namespace Server.Repositories.Interfaces;

public interface IPurchaseRepository
{
    Task<IEnumerable<PurchaseDocumentDto>> GetAllAsync();
    Task<PurchaseDocumentDto?> GetByIdAsync(int id);
    Task<PurchaseDocument?> GetDocumentAsync(int id);
    Task<List<PurchaseItem>> GetItemsAsync(int documentId);
    Task<PurchaseDocument> AddDocumentAsync(PurchaseDocument document);
    Task AddItemsAsync(List<PurchaseItem> items);
    Task UpdateDocumentAsync(PurchaseDocument document);

    /// <summary>Drops a document's lines, leaving the document itself. Rewriting one takes its
    /// old lines off the balances and then writes the new set.</summary>
    Task DeleteItemsAsync(int documentId);

    Task<bool> DeleteAsync(int id);
}
