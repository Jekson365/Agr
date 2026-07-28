namespace Server.Models;

/// <summary>Body of the fruit-product sale endpoint (POST /api/treeproductmovements/sale): how
/// much was sold. A negative Market movement is logged against the product's balance.</summary>
public record TreeProductSaleRequest(int TreeProductId, decimal Quantity);
