using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.Models;
using Server.Repositories.Interfaces;

namespace Server.Repositories;

public class SoilInvestigationRepository(AppDbContext context) : ISoilInvestigationRepository
{
    public async Task<IEnumerable<SoilInvestigation>> GetByPlotAsync(int landPlotId)
    {
        return await context.SoilInvestigations
            .AsNoTracking()
            .Where(i => i.LandPlotId == landPlotId)
            .OrderByDescending(i => i.InvestigationDate)
            .ThenByDescending(i => i.Id)
            .ToListAsync();
    }

    public async Task<SoilInvestigationDetail?> GetDetailAsync(int id)
    {
        var investigation = await context.SoilInvestigations.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        return investigation is null
            ? null
            : new SoilInvestigationDetail { Investigation = investigation, Results = await ResultsAsync(id) };
    }

    public async Task<SoilInvestigationDetail> AddAsync(SoilInvestigation investigation, List<SoilInvestigationResult> results)
    {
        context.SoilInvestigations.Add(investigation);
        await context.SaveChangesAsync();

        await WriteResultsAsync(investigation.Id, results);
        return new SoilInvestigationDetail { Investigation = investigation, Results = await ResultsAsync(investigation.Id) };
    }

    public async Task<SoilInvestigationDetail?> UpdateAsync(SoilInvestigation investigation, List<SoilInvestigationResult> results)
    {
        var existing = await context.SoilInvestigations.FindAsync(investigation.Id);
        if (existing is null)
        {
            return null;
        }

        existing.InvestigationDate = investigation.InvestigationDate;
        existing.SamplingDate = investigation.SamplingDate;
        existing.SamplingDepthCm = investigation.SamplingDepthCm;
        existing.Laboratory = investigation.Laboratory;
        existing.SampleNumber = investigation.SampleNumber;
        existing.Status = investigation.Status;
        existing.Notes = investigation.Notes;
        existing.ReportPath = investigation.ReportPath;

        var stale = await context.SoilInvestigationResults
            .Where(r => r.SoilInvestigationId == investigation.Id).ToListAsync();
        context.SoilInvestigationResults.RemoveRange(stale);
        await context.SaveChangesAsync();

        await WriteResultsAsync(investigation.Id, results);
        return new SoilInvestigationDetail { Investigation = existing, Results = await ResultsAsync(investigation.Id) };
    }

    public async Task<SoilInvestigation?> DeleteAsync(int id)
    {
        var existing = await context.SoilInvestigations.FindAsync(id);
        if (existing is null)
        {
            return null;
        }

        context.SoilInvestigations.Remove(existing);
        await context.SaveChangesAsync();
        return existing;
    }

    private async Task WriteResultsAsync(int investigationId, List<SoilInvestigationResult> results)
    {
        if (results.Count == 0)
        {
            return;
        }

        foreach (var result in results)
        {
            result.Id = 0;
            result.SoilInvestigationId = investigationId;
        }

        context.SoilInvestigationResults.AddRange(results);
        await context.SaveChangesAsync();
    }

    private Task<List<SoilInvestigationResult>> ResultsAsync(int investigationId)
    {
        return context.SoilInvestigationResults
            .AsNoTracking()
            .Where(r => r.SoilInvestigationId == investigationId)
            .OrderBy(r => r.ParameterId)
            .ThenBy(r => r.Id)
            .ToListAsync();
    }
}
