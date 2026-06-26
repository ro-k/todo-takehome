using System.ComponentModel.DataAnnotations;
using TodoTakehome.Api.Models;

namespace TodoTakehome.Api.Dtos.Tasks;

public sealed class CreateTaskRequestDto : IValidatableObject
{
    [Required]
    [MaxLength(TodoTaskLimits.TitleMaxLength, ErrorMessage = TodoTaskLimits.TitleMaxLengthMessage)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(TodoTaskLimits.DescriptionMaxLength, ErrorMessage = TodoTaskLimits.DescriptionMaxLengthMessage)]
    public string? Description { get; init; }

    public DateOnly? DueDate { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", [nameof(Title)]);
        }
    }
}
