namespace Server.Models;

public class Livestock
{
    public int Id { get; set; }
    public AnimalType Type { get; set; }
    public int Count { get; set; }
    public string Name { get; set; } = string.Empty;
    public int FarmId { get; set; }
}
