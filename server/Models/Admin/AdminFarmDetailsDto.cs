namespace Server.Models.Admin;

public class AdminSeedDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public SeedUnit Unit { get; set; }
    public bool IsDeleted { get; set; }
}

public class AdminEquipmentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string ImagePath { get; set; } = string.Empty;
}

public class AdminWineBatchDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Vintage { get; set; }
    public WineStage Stage { get; set; }
    public decimal Liters { get; set; }
    public int Bottles { get; set; }
    public bool IsDeleted { get; set; }
}

public class AdminRecordCountsDto
{
    public int Animals { get; set; }
    public int Productions { get; set; }
    public int Purchases { get; set; }
    public int CalendarEvents { get; set; }
    public int HarvestEvents { get; set; }
    public int PlantScans { get; set; }
}
