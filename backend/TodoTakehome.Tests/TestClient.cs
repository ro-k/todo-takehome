using System.Net;
using Microsoft.AspNetCore.Mvc.Testing;

namespace TodoTakehome.Tests;

internal static class TestClient
{
    public static HttpClient Create(TodoTakehomeApiFactory factory)
    {
        return factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            BaseAddress = new Uri("https://localhost")
        });
    }

    public static async Task AssertStatusCodeAsync(HttpStatusCode expectedStatusCode, HttpResponseMessage response)
    {
        var responseBody = await response.Content.ReadAsStringAsync();
        Assert.True(response.StatusCode == expectedStatusCode,
            $"Expected {expectedStatusCode}, got {response.StatusCode}. Response body: {responseBody}");
    }
}
