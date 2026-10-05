using Microsoft.AspNetCore.Mvc;
using Server.Models;

namespace Server.Controllers;

public partial class WineBatchesController
{
    [HttpPost]
    public async Task<ActionResult<WineBatchSummary>> Create(CreateWineBatchRequest request)
    {
        if (Validate(request.Name, request.Vintage) is { } invalid)
        {
            return BadRequest(invalid);
        }
        if (request.Liters < 0)
        {
            return BadRequest("Liters cannot be negative.");
        }
        if (request.Grapes.Any(line => line.Amount <= 0))
        {
            return BadRequest("Each grape amount must be positive.");
        }
        if (request.Grapes.Select(line => line.TreeProductId).Distinct().Count() != request.Grapes.Count)
        {
            return BadRequest("Each vineyard's grapes are listed once.");
        }

        foreach (var line in request.Grapes)
        {
            if (await grapeRepository.GetProductCategoryAsync(line.TreeProductId) != TreeProductCategory.Wine)
            {
                return BadRequest("Only grapes from a vineyard can go into a wine batch.");
            }
            var available = await grapeRepository.GetAvailableAsync(line.TreeProductId);
            if (line.Amount > available)
            {
                return Conflict($"Only {available} kg of these grapes is available.");
            }
        }

        try
        {
            await planLimitService.EnsureModuleAllowedAsync(FarmModule.Wine);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired, ex.Message);
        }

        await using var transaction = await context.Database.BeginTransactionAsync();
        var batch = await batchRepository.AddAsync(new WineBatch
        {
            Name = request.Name.Trim(),
            Vintage = request.Vintage,
            Color = request.Color,
            Method = request.Method,
            StartDate = request.StartDate,
            Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(),
        });

        foreach (var line in request.Grapes)
        {
            await grapeRepository.AddAsync(
                new WineBatchGrape { WineBatchId = batch.Id, TreeProductId = line.TreeProductId, Amount = line.Amount },
                request.StartDate);
        }

        if (request.Liters > 0)
        {
            await movementRepository.AddAsync(new WineMovement
            {
                WineBatchId = batch.Id,
                Delta = request.Liters,
                Source = WineMovementSource.Production,
                Date = request.StartDate,
            });
        }

        await transaction.CommitAsync();
        var summary = (await batchRepository.GetSummariesAsync(true, batch.Id)).First();
        return CreatedAtAction(nameof(GetById), new { id = batch.Id }, summary);
    }
}
