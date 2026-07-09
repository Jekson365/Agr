namespace Server.Models;

public class Farm
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public string Location { get; set; } = string.Empty;
}
