using TodoTakehome.Api.Models;

namespace TodoTakehome.Api.Services;

public interface IPasswordHasher
{
    string HashPassword(User user, string password);

    bool VerifyPassword(User user, string passwordHash, string password);
}
