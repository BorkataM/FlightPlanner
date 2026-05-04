using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FlightPlanner.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIcaoCodeToAirports : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "IataCode",
                table: "Airports",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<string>(
                name: "IcaoCode",
                table: "Airports",
                type: "character varying(4)",
                maxLength: 4,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Airports_IcaoCode",
                table: "Airports",
                column: "IcaoCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Airports_IcaoCode",
                table: "Airports");

            migrationBuilder.DropColumn(
                name: "IcaoCode",
                table: "Airports");

            migrationBuilder.AlterColumn<string>(
                name: "IataCode",
                table: "Airports",
                type: "text",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(3)",
                oldMaxLength: 3,
                oldNullable: true);
        }
    }
}
