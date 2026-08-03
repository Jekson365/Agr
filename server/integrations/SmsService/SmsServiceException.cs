namespace Server.Integrations.SmsService;

/// <summary>An SMS could not be handed to smsservice.ge.</summary>
public class SmsServiceException(string message) : Exception(message);
