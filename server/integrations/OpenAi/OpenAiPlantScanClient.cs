using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Options;
using Server.Integrations.OpenAi.Models;

namespace Server.Integrations.OpenAi;

/// <summary>
/// Typed <see cref="HttpClient"/> wrapper over OpenAI's Chat Completions API (vision + structured
/// outputs). The API key is read from configuration (see <see cref="OpenAiOptions"/>) and stays
/// server-side — the app only ever talks to our own <c>/api/plantscan</c> endpoint, never to OpenAI directly.
/// </summary>
public class OpenAiPlantScanClient(
    HttpClient httpClient,
    IOptions<OpenAiOptions> options,
    ILogger<OpenAiPlantScanClient> logger) : IPlantScanClient
{
    private readonly OpenAiOptions _options = options.Value;

    private static readonly JsonSerializerOptions ResultJsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private const string SystemPrompt =
        "You are an agronomist assistant that inspects photos of crops, garden plants, and houseplants "
        + "to identify diseases, pests, and nutrient deficiencies. Base your assessment only on what is "
        + "visible in the photo. Respond with practical, concise treatment steps a farmer could act on "
        + "immediately, plus a few prevention tips. If the photo does not clearly show a plant, set "
        + "plantDetected to false and leave the other fields at safe defaults (isHealthy=false, "
        + "diseaseName and severity empty/\"None\", empty arrays).";

    public async Task<PlantScanResult> AnalyzeAsync(
        Stream imageStream,
        string contentType,
        string? language,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new InvalidOperationException(
                "OpenAI API key is not configured. Set 'OpenAi:ApiKey' via appsettings.Development.json, "
                + "user-secrets, or the OpenAi__ApiKey environment variable.");
        }

        using var buffer = new MemoryStream();
        await imageStream.CopyToAsync(buffer, cancellationToken);
        var dataUri = $"data:{contentType};base64,{Convert.ToBase64String(buffer.ToArray())}";

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = JsonContent.Create(BuildRequestBody(dataUri, language)),
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        HttpResponseMessage response;
        try
        {
            response = await httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException ex)
        {
            logger.LogError(ex, "OpenAI request failed.");
            throw new OpenAiException("Could not reach the AI scanning service.");
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogError(ex, "OpenAI request timed out.");
            throw new OpenAiException("The AI scanning service timed out.");
        }

        var payload = await response.Content.ReadFromJsonAsync<OpenAiChatResponse>(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var message = payload?.Error?.Message ?? $"AI scanning service returned {(int)response.StatusCode}.";
            logger.LogWarning("OpenAI error: {Message}", message);
            throw new OpenAiException(message);
        }

        var content = payload?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new OpenAiException("AI scanning service returned an empty response.");
        }

        PlantScanResult? result;
        try
        {
            result = JsonSerializer.Deserialize<PlantScanResult>(content, ResultJsonOptions);
        }
        catch (JsonException ex)
        {
            logger.LogError(ex, "Failed to parse OpenAI plant scan response: {Content}", content);
            throw new OpenAiException("AI scanning service returned an unexpected response.");
        }

        return result ?? throw new OpenAiException("AI scanning service returned an unexpected response.");
    }

    private JsonObject BuildRequestBody(string imageDataUri, string? language) => new()
    {
        ["model"] = _options.Model,
        ["temperature"] = 0.2,
        ["max_tokens"] = 900,
        ["messages"] = new JsonArray
        {
            new JsonObject { ["role"] = "system", ["content"] = SystemPrompt },
            new JsonObject
            {
                ["role"] = "user",
                ["content"] = new JsonArray
                {
                    new JsonObject
                    {
                        ["type"] = "text",
                        ["text"] = "Identify any disease, pest damage, or deficiency in this plant photo and "
                            + "recommend treatment.",
                    },
                    new JsonObject
                    {
                        ["type"] = "text",
                        ["text"] = $"Write all free-text fields (plantName, diseaseName, summary, symptoms, "
                            + $"treatments, preventionTips) in {LanguageName(language)}. Keep the \"severity\" "
                            + "field exactly as one of: None, Low, Medium, High — do not translate it.",
                    },
                    new JsonObject
                    {
                        ["type"] = "image_url",
                        ["image_url"] = new JsonObject { ["url"] = imageDataUri },
                    },
                },
            },
        },
        ["response_format"] = BuildResponseFormat(),
    };

    private static string LanguageName(string? languageCode) => languageCode?.Trim().ToLowerInvariant() switch
    {
        "ka" => "Georgian",
        "en" => "English",
        _ => "English",
    };

    // A JsonNode can only ever belong to one parent, so this builds a fresh tree on every call
    // rather than sharing one static instance across requests.
    // OpenAI Structured Outputs schema — strict mode requires every property listed in "required"
    // and additionalProperties:false at every object level.
    private static JsonObject BuildResponseFormat() => new()
    {
        ["type"] = "json_schema",
        ["json_schema"] = new JsonObject
        {
            ["name"] = "plant_scan_result",
            ["strict"] = true,
            ["schema"] = new JsonObject
            {
                ["type"] = "object",
                ["properties"] = new JsonObject
                {
                    ["plantDetected"] = new JsonObject { ["type"] = "boolean" },
                    ["plantName"] = new JsonObject { ["type"] = "string" },
                    ["isHealthy"] = new JsonObject { ["type"] = "boolean" },
                    ["diseaseName"] = new JsonObject { ["type"] = "string" },
                    ["severity"] = new JsonObject
                    {
                        ["type"] = "string",
                        ["enum"] = new JsonArray { "None", "Low", "Medium", "High" },
                    },
                    ["confidence"] = new JsonObject { ["type"] = "number" },
                    ["summary"] = new JsonObject { ["type"] = "string" },
                    ["symptoms"] = new JsonObject
                    {
                        ["type"] = "array",
                        ["items"] = new JsonObject { ["type"] = "string" },
                    },
                    ["treatments"] = new JsonObject
                    {
                        ["type"] = "array",
                        ["items"] = new JsonObject { ["type"] = "string" },
                    },
                    ["preventionTips"] = new JsonObject
                    {
                        ["type"] = "array",
                        ["items"] = new JsonObject { ["type"] = "string" },
                    },
                },
                ["required"] = new JsonArray
                {
                    "plantDetected", "plantName", "isHealthy", "diseaseName", "severity",
                    "confidence", "summary", "symptoms", "treatments", "preventionTips",
                },
                ["additionalProperties"] = false,
            },
        },
    };
}
