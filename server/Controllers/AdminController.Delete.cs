using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Server.Services.Interfaces;

namespace Server.Controllers;

public partial class AdminController
{
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id, [FromServices] ITenantDatabaseProvisioner provisioner)
    {
        var op = await GetOperatorAsync();
        if (op is null)
        {
            return Forbid();
        }

        if (op.Id == id)
        {
            return Conflict("An operator cannot delete their own account.");
        }

        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        if (user.IsSuperAdmin)
        {
            return Conflict("An operator account cannot be deleted.");
        }

        await using var transaction = await context.Database.BeginTransactionAsync();
        context.Users.Remove(user);
        await context.SaveChangesAsync();

        try
        {
            await provisioner.DropAsync(user.Id);
        }
        catch (NpgsqlException ex)
        {
            logger.LogError(ex, "Dropping the database of account {UserId} failed, so the account was kept.", id);
            return StatusCode(StatusCodes.Status500InternalServerError,
                "The account's database could not be removed, so the account was kept.");
        }

        await transaction.CommitAsync();

        logger.LogWarning(
            "Account {UserId} ({Email}) and its database deleted by operator {OperatorId} ({OperatorEmail})",
            id, user.Email, op.Id, op.Email);

        return NoContent();
    }
}
