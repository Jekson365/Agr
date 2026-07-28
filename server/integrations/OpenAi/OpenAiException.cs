namespace Server.Integrations.OpenAi;

/// <summary>Thrown when a call to the OpenAI API fails or returns an error payload.</summary>
public class OpenAiException(string message) : Exception(message);
