namespace Server.Models;

/// <summary>One tree a batch of spot treatments is being written against.</summary>
public class TreeSpotTarget
{
    public int Index { get; set; }

    public double Latitude { get; set; }

    public double Longitude { get; set; }
}
