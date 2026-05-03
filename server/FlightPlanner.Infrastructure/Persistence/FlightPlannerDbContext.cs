using CsvHelper;
using FlightPlanner.Core.Entities;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
namespace FlightPlanner.Infrastructure.Persistence
{
    public class FlightPlannerDbContext : DbContext
    {
        public FlightPlannerDbContext(DbContextOptions<FlightPlannerDbContext> options) : base(options) { }

        public DbSet<Flight> Flights { get; set; }
        public DbSet<Airport> Airports { get; set; }
        public DbSet<Airline> Airlines { get; set; }
        public DbSet<FlightAnalytics> FlightAnalytics { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Flight>()
                .HasOne(f => f.Origin)
                .WithMany(a => a.DepartingFlights)
                .HasForeignKey(f => f.OriginAirportId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Flight>()
                .HasOne(f => f.Destination)
                .WithMany(a => a.ArrivingFlights)
                .HasForeignKey(f => f.DestinationAirportId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }

        public static async Task SeedAirportsAsync(FlightPlannerDbContext context)
        {
            if (context.Airports.Any()) return;

            var path = Path.Combine(AppContext.BaseDirectory, "Resources", "airports.csv");

            if (!File.Exists(path))
            {
                throw new FileNotFoundException($"CSV файлът не е намерен на път: {path}");
            }

            using var reader = new StreamReader(path);
            using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

            var records = csv.GetRecords<dynamic>();
            var airportsToSave = new List<Airport>();

            foreach (var record in records)
            {
                var dict = (IDictionary<string, object>)record;

                string iata = dict["iata_code"]?.ToString() ?? "";
                string type = dict["type"]?.ToString() ?? "";

                if (!string.IsNullOrEmpty(iata) && (type == "large_airport" || type == "medium_airport"))
                {
                    airportsToSave.Add(new Airport
                    {
                        IataCode = iata,
                        Name = dict["name"]?.ToString() ?? "Unknown",
                        City = dict["municipality"]?.ToString() ?? "Unknown",
                        Country = dict["iso_country"]?.ToString() ?? "Unknown",
                        Latitude = double.Parse(dict["latitude_deg"]?.ToString() ?? "0", CultureInfo.InvariantCulture),
                        Longitude = double.Parse(dict["longitude_deg"]?.ToString() ?? "0", CultureInfo.InvariantCulture)
                    });
                }
            }

            await context.Airports.AddRangeAsync(airportsToSave);
            await context.SaveChangesAsync();
        }
    }
}
