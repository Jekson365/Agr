using Server.Models;

namespace Server.Services.Interfaces;

public interface IVisitRecorder
{
    Task RecordAsync(RecordVisitRequest request, string ip, string userAgent);
}
