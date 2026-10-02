using Server.Models;
using Server.Models.Admin;

namespace Server.Repositories.Interfaces;

public interface ISiteVisitRepository
{
    Task AddAsync(SiteVisit visit);

    Task<SiteVisit?> FindLocatedAsync(string ip, DateTime since);

    Task<VisitSummaryDto> GetSummaryAsync(VisitFilter filter);

    Task<VisitSessionListDto> GetSessionsAsync(VisitFilter filter, int page, int pageSize);
}
