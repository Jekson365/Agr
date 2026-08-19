using Server.Models;

namespace Server.Services.Interfaces;

/// <summary>Where the bank is asked to take a payment, and where its callbacks are proved genuine.</summary>
public interface IBogPaymentService
{
    /// <summary>False when no merchant credentials are configured, so callers can refuse the
    /// checkout up front instead of failing at the bank.</summary>
    bool IsConfigured { get; }

    /// <summary>
    /// Registers <paramref name="order"/> with the bank and returns where to send the buyer to
    /// pay, along with the bank's own id for it. Throws when the bank refuses.
    /// </summary>
    Task<(string BogOrderId, string RedirectUrl)> CreateOrderAsync(MarketOrder order, MarketListing listing);

    /// <summary>
    /// Whether <paramref name="rawBody"/> really came from the bank, judged by the RSA signature in
    /// the request's Callback-Signature header. Anything that fails this is discarded: the callback
    /// is a public endpoint, so without the check anyone could POST "paid" at it.
    /// </summary>
    bool VerifyCallbackSignature(string rawBody, string? signatureHeader);
}
