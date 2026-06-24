using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TodoTakehome.Api.Data;
using TodoTakehome.Api.Dtos.Auth;
using TodoTakehome.Api.Models;
using TodoTakehome.Api.Services;

namespace TodoTakehome.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(AppDbContext dbContext, IPasswordHasher passwordHasher) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register(RegisterRequestDto request, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var emailExists = await dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);

        if (emailExists)
        {
            ModelState.AddModelError(nameof(request.Email), "Email is already registered.");
            return ValidationProblem(ModelState);
        }

        var user = new User
        {
            Email = email,
            PasswordHash = string.Empty
        };
        user.PasswordHash = passwordHasher.HashPassword(user, request.Password);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        await SignInAsync(user);

        return CreatedAtAction(nameof(Me), ToAuthResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login(LoginRequestDto request, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(request.Email);
        var user = await dbContext.Users.SingleOrDefaultAsync(user => user.Email == email, cancellationToken);

        if (user is null || !passwordHasher.VerifyPassword(user, user.PasswordHash, request.Password))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        await SignInAsync(user);

        return Ok(ToAuthResponse(user));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseDto>> Me(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdClaim, CultureInfo.InvariantCulture, out var userId))
        {
            return Unauthorized();
        }

        var user = await dbContext.Users.FindAsync([userId], cancellationToken);

        return user is null ? Unauthorized() : Ok(ToAuthResponse(user));
    }

    private Task SignInAsync(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString(CultureInfo.InvariantCulture)),
            new Claim(ClaimTypes.Email, user.Email)
        };
        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        return HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);
    }

    private static AuthResponseDto ToAuthResponse(User user)
    {
        return new AuthResponseDto(new UserResponseDto(user.Id, user.Email));
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }
}
