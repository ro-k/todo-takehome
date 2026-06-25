using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoTakehome.Api.Data;
using TodoTakehome.Api.Dtos.Tasks;
using TodoTakehome.Api.Models;

namespace TodoTakehome.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class TasksController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskResponseDto>>> List(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var tasks = await dbContext.Tasks
            .Where(task => task.UserId == userId.Value)
            .OrderBy(task => task.CreatedAt)
            .Select(task => ToResponse(task))
            .ToListAsync(cancellationToken);

        return Ok(tasks);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskResponseDto>> Get(int id, CancellationToken cancellationToken)
    {
        var task = await FindCurrentUserTaskAsync(id, cancellationToken);

        return task is null ? NotFound() : Ok(ToResponse(task));
    }

    [HttpPost]
    public async Task<ActionResult<TaskResponseDto>> Create(CreateTaskRequestDto request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var now = DateTime.UtcNow;
        var task = new TodoTask
        {
            UserId = userId.Value,
            Title = request.Title,
            Description = request.Description,
            DueDate = request.DueDate,
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.Tasks.Add(task);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(Get), new { id = task.Id }, ToResponse(task));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskResponseDto>> Update(int id, UpdateTaskRequestDto request, CancellationToken cancellationToken)
    {
        var task = await FindCurrentUserTaskAsync(id, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        task.Title = request.Title;
        task.Description = request.Description;
        task.DueDate = request.DueDate;
        task.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(task));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var task = await FindCurrentUserTaskAsync(id, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        dbContext.Tasks.Remove(task);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPatch("{id:int}/complete")]
    public async Task<ActionResult<TaskResponseDto>> Complete(int id, CompleteTaskRequestDto request, CancellationToken cancellationToken)
    {
        var task = await FindCurrentUserTaskAsync(id, cancellationToken);
        if (task is null)
        {
            return NotFound();
        }

        task.IsComplete = request.IsComplete;
        task.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(task));
    }

    private async Task<TodoTask?> FindCurrentUserTaskAsync(int id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return null;
        }

        return await dbContext.Tasks.SingleOrDefaultAsync(
            task => task.Id == id && task.UserId == userId.Value,
            cancellationToken);
    }

    private int? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        return int.TryParse(userIdClaim, CultureInfo.InvariantCulture, out var userId) ? userId : null;
    }

    private static TaskResponseDto ToResponse(TodoTask task)
    {
        return new TaskResponseDto(
            task.Id,
            task.Title,
            task.Description,
            task.DueDate,
            task.IsComplete,
            task.CreatedAt,
            task.UpdatedAt);
    }
}
