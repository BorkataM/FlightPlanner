using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightPlanner.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStopsToFlight : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Stops",
                table: "Flights",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Stops",
                table: "Flights");
        }
    }
}
