using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightPlanner.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateFlightTableForOpenSky : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_DestinationAirportId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_OriginAirportId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "AircraftType",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "TravelClass",
                table: "Flights");

            migrationBuilder.RenameColumn(
                name: "OriginAirportId",
                table: "Flights",
                newName: "DepartureAirportId");

            migrationBuilder.RenameColumn(
                name: "DestinationAirportId",
                table: "Flights",
                newName: "ArrivalAirportId");

            migrationBuilder.RenameIndex(
                name: "IX_Flights_OriginAirportId",
                table: "Flights",
                newName: "IX_Flights_DepartureAirportId");

            migrationBuilder.RenameIndex(
                name: "IX_Flights_DestinationAirportId",
                table: "Flights",
                newName: "IX_Flights_ArrivalAirportId");

            migrationBuilder.AlterColumn<int>(
                name: "AirlineId",
                table: "Flights",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "Airline",
                table: "Flights",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastUpdated",
                table: "Flights",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Flights",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights",
                column: "AirlineId",
                principalTable: "Airlines",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_ArrivalAirportId",
                table: "Flights",
                column: "ArrivalAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_DepartureAirportId",
                table: "Flights",
                column: "DepartureAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_ArrivalAirportId",
                table: "Flights");

            migrationBuilder.DropForeignKey(
                name: "FK_Flights_Airports_DepartureAirportId",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "Airline",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "LastUpdated",
                table: "Flights");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Flights");

            migrationBuilder.RenameColumn(
                name: "DepartureAirportId",
                table: "Flights",
                newName: "OriginAirportId");

            migrationBuilder.RenameColumn(
                name: "ArrivalAirportId",
                table: "Flights",
                newName: "DestinationAirportId");

            migrationBuilder.RenameIndex(
                name: "IX_Flights_DepartureAirportId",
                table: "Flights",
                newName: "IX_Flights_OriginAirportId");

            migrationBuilder.RenameIndex(
                name: "IX_Flights_ArrivalAirportId",
                table: "Flights",
                newName: "IX_Flights_DestinationAirportId");

            migrationBuilder.AlterColumn<int>(
                name: "AirlineId",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AircraftType",
                table: "Flights",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TravelClass",
                table: "Flights",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airlines_AirlineId",
                table: "Flights",
                column: "AirlineId",
                principalTable: "Airlines",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_DestinationAirportId",
                table: "Flights",
                column: "DestinationAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Flights_Airports_OriginAirportId",
                table: "Flights",
                column: "OriginAirportId",
                principalTable: "Airports",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
