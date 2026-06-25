using System.ComponentModel.DataAnnotations;

namespace TodoTakehome.Api.Dtos.Tasks;

public sealed class UpdateTaskRequestDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; init; }

    public DateOnly? DueDate { get; init; }
}
