using System.Net;
using System.Net.Http.Json;
using TodoTakehome.Api.Dtos.Tasks;

namespace TodoTakehome.Tests;

public sealed class TaskEndpointTests
{
    [Fact]
    public async Task User_can_create_a_task()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);
        await RegisterAsync(client, "user@example.com");

        var response = await client.PostAsJsonAsync("/api/tasks", new
        {
            title = "Schedule appointment",
            description = "Confirm time",
            dueDate = "2026-07-01"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Created, response);
        var task = await response.Content.ReadFromJsonAsync<TaskResponseDto>();

        Assert.NotNull(task);
        Assert.True(task.Id > 0);
        Assert.Equal("Schedule appointment", task.Title);
        Assert.Equal("Confirm time", task.Description);
        Assert.Equal(new DateOnly(2026, 7, 1), task.DueDate);
        Assert.False(task.IsComplete);
    }

    [Fact]
    public async Task User_can_list_only_their_own_tasks()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var userAClient = TestClient.Create(factory);
        using var userBClient = TestClient.Create(factory);
        await RegisterAsync(userAClient, "a@example.com");
        await RegisterAsync(userBClient, "b@example.com");
        await CreateTaskAsync(userAClient, "Task A");
        await CreateTaskAsync(userBClient, "Task B");

        var response = await userAClient.GetAsync("/api/tasks");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.OK, response);
        var tasks = await response.Content.ReadFromJsonAsync<List<TaskResponseDto>>();

        Assert.NotNull(tasks);
        var task = Assert.Single(tasks);
        Assert.Equal("Task A", task.Title);
    }

    [Fact]
    public async Task User_cannot_read_another_users_task()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var ownerClient = TestClient.Create(factory);
        using var otherClient = TestClient.Create(factory);
        await RegisterAsync(ownerClient, "owner@example.com");
        await RegisterAsync(otherClient, "other@example.com");
        var task = await CreateTaskAsync(ownerClient, "Owned task");

        var response = await otherClient.GetAsync($"/api/tasks/{task.Id}");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.NotFound, response);
    }

    [Fact]
    public async Task User_cannot_update_another_users_task()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var ownerClient = TestClient.Create(factory);
        using var otherClient = TestClient.Create(factory);
        await RegisterAsync(ownerClient, "owner@example.com");
        await RegisterAsync(otherClient, "other@example.com");
        var task = await CreateTaskAsync(ownerClient, "Owned task");

        var response = await otherClient.PutAsJsonAsync($"/api/tasks/{task.Id}", new
        {
            title = "Changed",
            description = "Changed",
            dueDate = (string?)null
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.NotFound, response);
    }

    [Fact]
    public async Task User_cannot_delete_another_users_task()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var ownerClient = TestClient.Create(factory);
        using var otherClient = TestClient.Create(factory);
        await RegisterAsync(ownerClient, "owner@example.com");
        await RegisterAsync(otherClient, "other@example.com");
        var task = await CreateTaskAsync(ownerClient, "Owned task");

        var response = await otherClient.DeleteAsync($"/api/tasks/{task.Id}");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.NotFound, response);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Empty_or_whitespace_title_is_rejected(string title)
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);
        await RegisterAsync(client, "user@example.com");

        var response = await client.PostAsJsonAsync("/api/tasks", new
        {
            title,
            description = "Description",
            dueDate = (string?)null
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.BadRequest, response);
    }

    [Fact]
    public async Task Valid_update_succeeds()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);
        await RegisterAsync(client, "user@example.com");
        var task = await CreateTaskAsync(client, "Original");

        var response = await client.PutAsJsonAsync($"/api/tasks/{task.Id}", new
        {
            title = "Updated",
            description = "Updated description",
            dueDate = "2026-08-15"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.OK, response);
        var updatedTask = await response.Content.ReadFromJsonAsync<TaskResponseDto>();

        Assert.NotNull(updatedTask);
        Assert.Equal("Updated", updatedTask.Title);
        Assert.Equal("Updated description", updatedTask.Description);
        Assert.Equal(new DateOnly(2026, 8, 15), updatedTask.DueDate);
    }

    [Fact]
    public async Task Delete_removes_task_from_user_list()
    {
        await using var factory = new TodoTakehomeApiFactory();
        using var client = TestClient.Create(factory);
        await RegisterAsync(client, "user@example.com");
        var task = await CreateTaskAsync(client, "Delete me");

        var deleteResponse = await client.DeleteAsync($"/api/tasks/{task.Id}");
        var listResponse = await client.GetAsync("/api/tasks");

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.NoContent, deleteResponse);
        await TestClient.AssertStatusCodeAsync(HttpStatusCode.OK, listResponse);
        var tasks = await listResponse.Content.ReadFromJsonAsync<List<TaskResponseDto>>();

        Assert.NotNull(tasks);
        Assert.Empty(tasks);
    }

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            email,
            password = "password123"
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Created, response);
    }

    private static async Task<TaskResponseDto> CreateTaskAsync(HttpClient client, string title)
    {
        var response = await client.PostAsJsonAsync("/api/tasks", new
        {
            title,
            description = (string?)null,
            dueDate = (string?)null
        });

        await TestClient.AssertStatusCodeAsync(HttpStatusCode.Created, response);
        var task = await response.Content.ReadFromJsonAsync<TaskResponseDto>();

        Assert.NotNull(task);
        return task;
    }
}
