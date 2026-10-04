using System.Net;
using System.Threading.Channels;
using Microsoft.Extensions.Options;
using Server.Integrations.Email;
using Server.Models;

namespace Server.Services;

public record NewUserNotice(int Id, string Name, string Email, string PhoneNumber, string Method, DateTime CreatedAt);

public interface INewUserNotifier
{
    void Notify(User user, string method);
}

public class NewUserNotifier(
    IEmailSender emailSender,
    IOptions<EmailOptions> options,
    ILogger<NewUserNotifier> logger) : BackgroundService, INewUserNotifier
{
    private static readonly TimeZoneInfo Tbilisi = FindTbilisi();

    private readonly Channel<NewUserNotice> queue = Channel.CreateBounded<NewUserNotice>(
        new BoundedChannelOptions(500) { FullMode = BoundedChannelFullMode.DropOldest });

    public void Notify(User user, string method)
    {
        if (!emailSender.IsConfigured || string.IsNullOrWhiteSpace(options.Value.NewUserTo))
        {
            logger.LogInformation("New user {UserId} registered via {Method}; email notices are not configured.", user.Id, method);
            return;
        }

        queue.Writer.TryWrite(new NewUserNotice(user.Id, user.Name, user.Email, user.PhoneNumber, method, DateTime.UtcNow));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var notice in queue.Reader.ReadAllAsync(stoppingToken))
        {
            try
            {
                await emailSender.SendAsync(options.Value.NewUserTo, Subject(notice), Body(notice), stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogWarning(ex, "Could not send the new-user email for user {UserId}.", notice.Id);
            }
        }
    }

    private static string Subject(NewUserNotice notice) => $"ახალი მომხმარებელი: {notice.Name}";

    private static string Body(NewUserNotice notice)
    {
        var local = TimeZoneInfo.ConvertTimeFromUtc(notice.CreatedAt, Tbilisi);
        var rows = new (string Label, string Value)[]
        {
            ("სახელი", notice.Name),
            ("ელფოსტა", notice.Email),
            ("ტელეფონი", notice.PhoneNumber),
            ("რეგისტრაციის გზა", notice.Method),
            ("დრო", local.ToString("yyyy-MM-dd HH:mm")),
            ("ID", notice.Id.ToString()),
        };

        var cells = string.Concat(rows
            .Where(row => !string.IsNullOrWhiteSpace(row.Value))
            .Select(row => $"<tr><td style=\"padding:4px 12px 4px 0;color:#666\">{WebUtility.HtmlEncode(row.Label)}</td><td style=\"padding:4px 0\"><b>{WebUtility.HtmlEncode(row.Value)}</b></td></tr>"));

        return $"<div style=\"font-family:Arial,sans-serif;font-size:14px\"><p>მთაბარზე დარეგისტრირდა ახალი მომხმარებელი.</p><table>{cells}</table><p><a href=\"https://mtabari.com.ge/manager/users/{notice.Id}\">მომხმარებლის ნახვა</a></p></div>";
    }

    private static TimeZoneInfo FindTbilisi()
    {
        foreach (var id in new[] { "Asia/Tbilisi", "Georgian Standard Time" })
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById(id);
            }
            catch (TimeZoneNotFoundException)
            {
            }
        }
        return TimeZoneInfo.CreateCustomTimeZone("Tbilisi", TimeSpan.FromHours(4), "Tbilisi", "Tbilisi");
    }
}
