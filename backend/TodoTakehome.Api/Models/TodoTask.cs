namespace TodoTakehome.Api.Models;

public sealed class TodoTask
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public required string Title { get; set; }

    public string? Description { get; set; }

    public DateOnly? DueDate { get; set; }

    public bool IsComplete { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
