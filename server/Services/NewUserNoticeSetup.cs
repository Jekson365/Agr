using Server.Integrations.Email;

namespace Server.Services;

public static class NewUserNoticeSetup
{
    public static IServiceCollection AddNewUserNotices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.AddSingleton<IEmailSender, SmtpEmailSender>();
        services.AddSingleton<NewUserNotifier>();
        services.AddSingleton<INewUserNotifier>(sp => sp.GetRequiredService<NewUserNotifier>());
        services.AddHostedService(sp => sp.GetRequiredService<NewUserNotifier>());
        return services;
    }
}
