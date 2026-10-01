namespace Server.Models;

public class SaleAnimalDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public int LivestockId { get; set; }
    public string LivestockName { get; set; } = string.Empty;
    public string LivestockType { get; set; } = string.Empty;
    public Gender? Gender { get; set; }
    public DateOnly? BornDate { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}
