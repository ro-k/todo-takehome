using System.ComponentModel.DataAnnotations;

namespace TodoTakehome.Api.Dtos.Auth;

public sealed class RegisterRequestDto
{
    [Required]
    [EmailAddress]
    [MaxLength(320)]
    public string Email { get; init; } = string.Empty;

    [Required]
    [MinLength(8)]
    [MaxLength(100)]
    public string Password { get; init; } = string.Empty;
}
