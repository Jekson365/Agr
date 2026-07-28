namespace Server.Integrations.OpenAi;

/// <summary>Binds the "OpenAi" configuration section (see appsettings.json).</summary>
public class OpenAiOptions
{
    public const string SectionName = "OpenAi";

    /// <summary>Base address of the OpenAI REST API, including the trailing slash.</summary>
    public string BaseUrl { get; set; } = "https://api.openai.com/v1/";

    /// <summary>
    /// Your OpenAI API key. Never commit a real key — set it via user-secrets or the
    /// <c>OpenAi__ApiKey</c> environment variable.
    /// </summary>
    public string ApiKey { get; set; } = "";

    /// <summary>Vision-capable chat model used for plant scans.</summary>
    public string Model { get; set; } = "gpt-4o-mini";
}
