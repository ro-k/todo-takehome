namespace TodoTakehome.Api.Models;

public static class TodoTaskLimits
{
    public const int TitleMaxLength = 200;

    public const int DescriptionMaxLength = 2000;

    public const string TitleMaxLengthMessage = "Title must be 200 characters or fewer.";

    public const string DescriptionMaxLengthMessage = "Description must be 2000 characters or fewer.";
}
