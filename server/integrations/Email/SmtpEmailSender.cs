using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Options;

namespace Server.Integrations.Email;

public class SmtpEmailSender(IOptions<EmailOptions> options) : IEmailSender
{
    private readonly EmailOptions settings = options.Value;

    public bool IsConfigured => settings.IsConfigured;

    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var from = string.IsNullOrWhiteSpace(settings.From) ? settings.Username : settings.From;

        using var message = new MailMessage(from, to)
        {
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8,
        };

        using var client = new SmtpClient(settings.SmtpHost, settings.SmtpPort)
        {
            EnableSsl = settings.EnableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(settings.Username, settings.Password),
            Timeout = 15000,
        };

        await client.SendMailAsync(message, cancellationToken);
    }
}
