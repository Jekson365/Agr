using System.Text.Json.Serialization;

namespace Server.Integrations.OpenAi.Models;

/// <summary>Shape of OpenAI's <c>/chat/completions</c> response (only the fields we consume).</summary>
public class OpenAiChatResponse
{
    [JsonPropertyName("choices")]
    public List<OpenAiChoice>? Choices { get; set; }

    /// <summary>Present instead of choices when the request is rejected (bad key, bad request, etc).</summary>
    [JsonPropertyName("error")]
    public OpenAiError? Error { get; set; }
}

public class OpenAiChoice
{
    [JsonPropertyName("message")] public OpenAiResponseMessage? Message { get; set; }
}

public class OpenAiResponseMessage
{
    [JsonPropertyName("content")] public string? Content { get; set; }
}

public class OpenAiError
{
    [JsonPropertyName("message")] public string Message { get; set; } = string.Empty;
}
