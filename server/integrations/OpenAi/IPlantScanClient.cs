namespace Server.Integrations.OpenAi;

public interface IPlantScanClient
{
    /// <summary>
    /// Sends a plant photo to the AI vision model and returns a structured disease/treatment diagnosis,
    /// with free-text fields written in <paramref name="language"/> ("ka" or "en"; defaults to English).
    /// Throws <see cref="OpenAiException"/> on an upstream failure.
    /// </summary>
    Task<PlantScanResult> AnalyzeAsync(
        Stream imageStream,
        string contentType,
        string? language,
        CancellationToken cancellationToken = default);
}
