namespace Server.Models.Admin;

public class AdminUserOverviewDto
{
    public AdminUserDto User { get; set; } = new();
    public TenantDatabaseStatus Database { get; set; }
    public List<AdminFarmDto> Farms { get; set; } = [];
    public List<AdminStockDto> Stocks { get; set; } = [];
    public List<AdminLivestockDto> Livestock { get; set; } = [];
    public List<AdminTreeStockDto> TreeStocks { get; set; } = [];
    public List<AdminHarvestDto> Harvests { get; set; } = [];
    public AdminUserActivityDto Activity { get; set; } = new();
    public List<AdminSeedDto> Seeds { get; set; } = [];
    public List<AdminEquipmentDto> Equipment { get; set; } = [];
    public List<AdminWineBatchDto> WineBatches { get; set; } = [];
    public AdminRecordCountsDto Records { get; set; } = new();
}

public class AdminFarmDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ImagePath { get; set; } = string.Empty;
    public decimal Area { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsRemoved { get; set; }
    public List<AdminPlotDto> Plots { get; set; } = [];
}

public class AdminPlotDto
{
    public int Id { get; set; }
    public int FarmId { get; set; }
    public decimal Area { get; set; }
    public string Crop { get; set; } = string.Empty;
}

public class AdminStockDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public StockUnit Unit { get; set; }
    public StockCategory Category { get; set; }
    public bool IsDeleted { get; set; }
}

public class AdminLivestockDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}

public class AdminTreeStockDto
{
    public int Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public TreeStockUnit Unit { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public bool IsDeleted { get; set; }
}

public class AdminHarvestDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public HarvestKind Kind { get; set; }
    public HarvestStatus Status { get; set; }
    public DateOnly Date { get; set; }
    public DateOnly? ExpectedHarvestDate { get; set; }
    public string FarmName { get; set; } = string.Empty;
    public decimal? Revenue { get; set; }
    public decimal Cost { get; set; }
    public List<AdminHarvestYieldDto> Yields { get; set; } = [];
}

public class AdminHarvestYieldDto
{
    public string Source { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string Unit { get; set; } = string.Empty;
}
