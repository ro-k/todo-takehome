using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.DependencyInjection;
using TodoTakehome.Api.Data;
using TodoTakehome.Api.Dtos.Auth;

namespace TodoTakehome.Tests;

public sealed class AuthEndpointTests
{
    [Fact]
    public async Task Register_creates_user_and_signs_in()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "USER@example.com",
            password = "password123"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Created, response);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), value => value.Contains("todo-takehome-auth"));

        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(body);
        Assert.Equal("user@example.com", body.User.Email);

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var user = dbContext.Users.Single();

        Assert.Equal("user@example.com", user.Email);
        Assert.NotEqual("password123", user.PasswordHash);
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
    }

    [Fact]
    public async Task Login_with_valid_password_signs_in()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user@example.com",
            password = "password123"
        });

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "user@example.com",
            password = "password123"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.OK, response);
        Assert.Contains(response.Headers.GetValues("Set-Cookie"), value => value.Contains("todo-takehome-auth"));
    }

    [Fact]
    public async Task Login_with_invalid_password_returns_unauthorized()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user@example.com",
            password = "password123"
        });

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "user@example.com",
            password = "wrong-password"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Unauthorized, response);
    }

    [Fact]
    public async Task Me_returns_current_user_when_authenticated()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user@example.com",
            password = "password123"
        });

        var response = await client.GetAsync("/api/auth/me");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.OK, response);

        var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        Assert.NotNull(body);
        Assert.Equal("user@example.com", body.User.Email);
    }

    [Fact]
    public async Task Logout_clears_authenticated_session()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);

        await client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "user@example.com",
            password = "password123"
        });

        var logoutResponse = await client.PostAsync("/api/auth/logout", null);
        var meResponse = await client.GetAsync("/api/auth/me");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.NoContent, logoutResponse);
        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Unauthorized, meResponse);
    }
}
