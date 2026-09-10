using Server.Models;

namespace Server.Data;

public static class SoilParameterSeed
{
    public const int Relief = 1;
    public const int VegetationCover = 2;
    public const int MechanicalComposition = 3;
    public const int SoilStructure = 4;
    public const int Humus = 12;
    public const int Ph = 10;
    public const int AbsorbedBaseComposition = 16;

    public static readonly SoilParameterDefinition[] Parameters =
    [
        new() { Id = 1, Key = "relief", Group = SoilParameterGroup.FieldConditions, ValueKind = SoilParameterValueKind.Category, SortOrder = 1 },
        new() { Id = 2, Key = "vegetationCover", Group = SoilParameterGroup.FieldConditions, ValueKind = SoilParameterValueKind.Category, SortOrder = 2 },

        new() { Id = 3, Key = "mechanicalComposition", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Category, SortOrder = 10 },
        new() { Id = 4, Key = "soilStructure", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Category, SortOrder = 11 },
        new() { Id = 5, Key = "fieldCapacity", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", SortOrder = 12, IsRegulationParameter = false },
        new() { Id = 6, Key = "bulkDensity", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "g/cm3", SortOrder = 13, IsRegulationParameter = false },
        new() { Id = 7, Key = "porosity", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", SortOrder = 14, IsRegulationParameter = false },
        new() { Id = 8, Key = "permeability", Group = SoilParameterGroup.Physical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "mm/h", SortOrder = 15, IsRegulationParameter = false },

        new() { Id = 9, Key = "carbonates", Group = SoilParameterGroup.Chemical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", SortOrder = 20 },
        new() { Id = 10, Key = "ph", Group = SoilParameterGroup.Chemical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "pH", SortOrder = 21 },
        new() { Id = 11, Key = "acidity", Group = SoilParameterGroup.Chemical, ValueKind = SoilParameterValueKind.Numeric, SortOrder = 22 },
        new() { Id = 12, Key = "humus", Group = SoilParameterGroup.Chemical, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", SortOrder = 23 },

        new() { Id = 13, Key = "nitrogen", Group = SoilParameterGroup.Nutrients, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", DefaultUnitAvailable = "mg/kg", SupportsForms = true, SortOrder = 30 },
        new() { Id = 14, Key = "phosphorus", Group = SoilParameterGroup.Nutrients, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", DefaultUnitAvailable = "mg/kg", SupportsForms = true, SortOrder = 31 },
        new() { Id = 15, Key = "potassium", Group = SoilParameterGroup.Nutrients, ValueKind = SoilParameterValueKind.Numeric, DefaultUnit = "%", DefaultUnitAvailable = "mg/kg", SupportsForms = true, SortOrder = 32 },

        new() { Id = 16, Key = "absorbedBaseComposition", Group = SoilParameterGroup.AbsorbedBases, ValueKind = SoilParameterValueKind.Category, SortOrder = 40 },
        new() { Id = 17, Key = "calcium", Group = SoilParameterGroup.AbsorbedBases, ValueKind = SoilParameterValueKind.Numeric, SortOrder = 41 },
        new() { Id = 18, Key = "calciumMagnesium", Group = SoilParameterGroup.AbsorbedBases, ValueKind = SoilParameterValueKind.Numeric, SortOrder = 42 },
        new() { Id = 19, Key = "sodium", Group = SoilParameterGroup.AbsorbedBases, ValueKind = SoilParameterValueKind.Numeric, SortOrder = 43 },
        new() { Id = 20, Key = "hydrogenAcidity", Group = SoilParameterGroup.AbsorbedBases, ValueKind = SoilParameterValueKind.Numeric, SortOrder = 44 },
    ];

    public static readonly SoilParameterCategory[] Categories =
    [
        new() { Id = 1, ParameterId = MechanicalComposition, Key = "heavyClay", SortOrder = 1 },
        new() { Id = 2, ParameterId = MechanicalComposition, Key = "mediumClay", SortOrder = 2 },
        new() { Id = 3, ParameterId = MechanicalComposition, Key = "otherClay", SortOrder = 3 },
        new() { Id = 4, ParameterId = MechanicalComposition, Key = "sandyHeavyLoam", SortOrder = 4 },
        new() { Id = 5, ParameterId = MechanicalComposition, Key = "mediumLoam", SortOrder = 5 },
        new() { Id = 6, ParameterId = MechanicalComposition, Key = "silt", SortOrder = 6 },
        new() { Id = 7, ParameterId = MechanicalComposition, Key = "sand", SortOrder = 7 },

        new() { Id = 8, ParameterId = SoilStructure, Key = "wellStructured", SortOrder = 1 },
        new() { Id = 9, ParameterId = SoilStructure, Key = "moderatelyStructured", SortOrder = 2 },
        new() { Id = 10, ParameterId = SoilStructure, Key = "weaklyStructured", SortOrder = 3 },
        new() { Id = 11, ParameterId = SoilStructure, Key = "structureless", SortOrder = 4 },

        new() { Id = 12, ParameterId = AbsorbedBaseComposition, Key = "calcium", SortOrder = 1 },
        new() { Id = 13, ParameterId = AbsorbedBaseComposition, Key = "calciumMagnesium", SortOrder = 2 },
        new() { Id = 14, ParameterId = AbsorbedBaseComposition, Key = "sodium", SortOrder = 3 },
        new() { Id = 15, ParameterId = AbsorbedBaseComposition, Key = "hydrogen", SortOrder = 4 },
    ];
}
