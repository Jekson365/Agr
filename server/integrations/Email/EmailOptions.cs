namespace Server.Integrations.Email;

public class EmailOptions
{
    public const string SectionName = "Email";

    public bool Enabled { get; set; }

    public string SmtpHost { get; set; } = "smtp.gmail.com";

    public int SmtpPort { get; set; } = 587;

    public bool EnableSsl { get; set; } = true;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string From { get; set; } = string.Empty;

    public string NewUserTo { get; set; } = string.Empty;

    public bool IsConfigured =>
        Enabled && !string.IsNullOrWhiteSpace(Username) && !string.IsNullOrWhiteSpace(Password);
}
