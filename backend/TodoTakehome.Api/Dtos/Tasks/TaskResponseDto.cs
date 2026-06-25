namespace TodoTakehome.Api.Dtos.Tasks;

public sealed record TaskResponseDto(
    int Id,
    string Title,
    string? Description,
    DateOnly? DueDate,
    bool IsComplete,
    DateTime CreatedAt,
    DateTime UpdatedAt);
