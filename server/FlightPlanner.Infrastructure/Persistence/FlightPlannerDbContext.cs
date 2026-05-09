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
        public DbSet<User> Users { get; set; }
        public DbSet<Booking> Bookings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Flight>()
                .HasOne(f => f.DepartureAirport)
                .WithMany(a => a.DepartingFlights)
                .HasForeignKey(f => f.DepartureAirportId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Flight>()
                .HasOne(f => f.ArrivalAirport)
                .WithMany(a => a.ArrivingFlights)
                .HasForeignKey(f => f.ArrivalAirportId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Flight)
                .WithMany(f => f.Bookings)
                .HasForeignKey(b => b.FlightId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);
        }

        public static async Task SeedAirportsAsync(FlightPlannerDbContext context)
        {
            if (await context.Airports.AnyAsync()) return;

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

                string icao = dict["ident"]?.ToString() ?? "";
                string type = dict["type"]?.ToString() ?? "";

                if (!string.IsNullOrEmpty(icao) && (type == "large_airport" || type == "medium_airport"))
                {
                    airportsToSave.Add(new Airport
                    {
                        IcaoCode = icao.ToUpper(),
                        IataCode = dict["iata_code"]?.ToString()?.ToUpper(),
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

        public static async Task SeedAirlinesAsync(FlightPlannerDbContext context)
        {
            if (await context.Airlines.AnyAsync()) return;

            var airlines = new List<Airline>
    {
        new Airline { IcaoCode = "LZB", Name = "Bulgaria Air", EcoRating = 3.5 },
        new Airline { IcaoCode = "BGH", Name = "BH Air", EcoRating = 3.2 },
        new Airline { IcaoCode = "THY", Name = "Turkish Airlines", EcoRating = 4.1 },
        new Airline { IcaoCode = "DLH", Name = "Lufthansa", EcoRating = 4.5 },
        new Airline { IcaoCode = "BAW", Name = "British Airways", EcoRating = 4.3 },
        new Airline { IcaoCode = "EZY", Name = "EasyJet", EcoRating = 3.8 },
        new Airline { IcaoCode = "EJU", Name = "EasyJet Europe", EcoRating = 3.8 },
        new Airline { IcaoCode = "RYR", Name = "Ryanair", EcoRating = 3.0 },
        new Airline { IcaoCode = "WZZ", Name = "Wizz Air", EcoRating = 3.1 },
        new Airline { IcaoCode = "AFR", Name = "Air France", EcoRating = 4.4 },
        new Airline { IcaoCode = "KLM", Name = "KLM Royal Dutch Airlines", EcoRating = 4.6 },
        new Airline { IcaoCode = "TVF", Name = "Transavia France", EcoRating = 3.7 },
        new Airline { IcaoCode = "PGT", Name = "Pegasus Airlines", EcoRating = 3.4 },
        new Airline { IcaoCode = "SAS", Name = "Scandinavian Airlines", EcoRating = 4.2 },
        new Airline { IcaoCode = "LOT", Name = "LOT Polish Airlines", EcoRating = 3.9 },
        new Airline { IcaoCode = "AUA", Name = "Austrian Airlines", EcoRating = 4.1 },
        new Airline { IcaoCode = "SWR", Name = "Swiss International Air Lines", EcoRating = 4.3 }
    };

            await context.Airlines.AddRangeAsync(airlines);
            await context.SaveChangesAsync();
        }
    }
}
