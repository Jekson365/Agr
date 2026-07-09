using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class ExpandMedicalRecordFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Title",
                table: "MedicalRecords",
                newName: "RecordType");

            migrationBuilder.AddColumn<string>(
                name: "ClinicName",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Cost",
                table: "MedicalRecords",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Diagnosis",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Dosage",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationDays",
                table: "MedicalRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FollowUpDate",
                table: "MedicalRecords",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HeartRate",
                table: "MedicalRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Medication",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Outcome",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RespiratoryRate",
                table: "MedicalRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Route",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Symptoms",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Temperature",
                table: "MedicalRecords",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Treatment",
                table: "MedicalRecords",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VeterinarianId",
                table: "MedicalRecords",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VisitDate",
                table: "MedicalRecords",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Weight",
                table: "MedicalRecords",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ClinicName",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Cost",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Diagnosis",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Dosage",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "DurationDays",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "FollowUpDate",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "HeartRate",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Medication",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "RespiratoryRate",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Route",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Symptoms",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Temperature",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Treatment",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "VeterinarianId",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "VisitDate",
                table: "MedicalRecords");

            migrationBuilder.DropColumn(
                name: "Weight",
                table: "MedicalRecords");

            migrationBuilder.RenameColumn(
                name: "RecordType",
                table: "MedicalRecords",
                newName: "Title");
        }
    }
}
