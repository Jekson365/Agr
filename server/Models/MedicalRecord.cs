namespace Server.Models;

/// <summary>
/// A vet visit record for a single animal (<see cref="LivestockDetail"/>): diagnosis, treatment,
/// vitals, and follow-up details for one visit.
/// </summary>
public class MedicalRecord
{
    public int Id { get; set; }
    public int StockId { get; set; }
    public DateTime VisitDate { get; set; }
    public string RecordType { get; set; } = string.Empty;
    public string? Diagnosis { get; set; }
    public string? Symptoms { get; set; }
    public string? Treatment { get; set; }
    public string? Medication { get; set; }
    public string? Dosage { get; set; }
    public string? Route { get; set; }
    public int? DurationDays { get; set; }
    public int? VeterinarianId { get; set; }
    public string? ClinicName { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Weight { get; set; }
    public int? HeartRate { get; set; }
    public int? RespiratoryRate { get; set; }
    public DateTime? FollowUpDate { get; set; }
    public decimal? Cost { get; set; }
    public string? Outcome { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
