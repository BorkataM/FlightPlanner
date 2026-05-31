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
        public DbSet<UserFollow> UserFollows { get; set; }

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

            modelBuilder.Entity<UserFollow>()
                .HasKey(uf => new { uf.FollowerId, uf.FolloweeId });

            modelBuilder.Entity<UserFollow>()
                .HasOne(uf => uf.Follower)
                .WithMany(u => u.Following)
                .HasForeignKey(uf => uf.FollowerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserFollow>()
                .HasOne(uf => uf.Followee)
                .WithMany(u => u.Followers)
                .HasForeignKey(uf => uf.FolloweeId)
                .OnDelete(DeleteBehavior.Restrict);

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

        public static async Task SeedFlightsAsync(FlightPlannerDbContext context)
        {
            // Skip if realistic European flights already exist
            var hasEuropeanFlights = await context.Flights
                .Include(f => f.DepartureAirport)
                .AnyAsync(f => f.DepartureAirport.IataCode == "SOF");
            if (hasEuropeanFlights) return;

            // Remove random garbage flights left from previous seeding
            context.FlightAnalytics.RemoveRange(context.FlightAnalytics);
            context.Flights.RemoveRange(context.Flights);
            await context.SaveChangesAsync();

            var iataCodes = new[] {
                "SOF","LHR","CDG","FRA","AMS","IST","VIE","MUC","ZRH",
                "WAW","BCN","FCO","MAD","ATH","PRG","DUB","CPH","BUD","OSL","MXP"
            };
            var airports = await context.Airports
                .Where(a => a.IataCode != null && iataCodes.Contains(a.IataCode))
                .ToDictionaryAsync(a => a.IataCode!, a => a.Id);

            var airlines = await context.Airlines
                .ToDictionaryAsync(a => a.IcaoCode, a => a);

            // (from, to, airlineIcao, durationMins, basePrice)
            var routes = new (string F, string T, string AL, int Dur, decimal Price)[]
            {
                // Sofia departures
                ("SOF","LHR","LZB",175,89m), ("SOF","LHR","WZZ",175,72m),
                ("SOF","CDG","LZB",195,95m), ("SOF","CDG","AFR",195,115m),
                ("SOF","FRA","LZB",185,88m), ("SOF","FRA","DLH",185,130m),
                ("SOF","AMS","KLM",200,95m),
                ("SOF","IST","LZB",90,55m),  ("SOF","IST","THY",90,65m),  ("SOF","IST","BGH",90,49m),
                ("SOF","VIE","AUA",100,69m), ("SOF","VIE","WZZ",100,45m),
                ("SOF","MUC","DLH",150,89m),
                ("SOF","ZRH","SWR",165,105m),
                ("SOF","WAW","LOT",145,72m), ("SOF","WAW","WZZ",145,49m),
                ("SOF","BCN","WZZ",225,65m),
                ("SOF","FCO","WZZ",160,59m),
                ("SOF","MAD","WZZ",260,79m),
                ("SOF","ATH","LZB",80,55m),
                ("SOF","PRG","WZZ",145,49m),
                ("SOF","DUB","RYR",270,45m),
                ("SOF","CPH","SAS",195,89m),
                ("SOF","BUD","WZZ",100,39m),
                ("SOF","OSL","WZZ",230,79m),
                ("SOF","MXP","WZZ",180,59m),
                // Returns to SOF
                ("LHR","SOF","LZB",175,89m), ("LHR","SOF","WZZ",175,72m),
                ("CDG","SOF","AFR",195,115m),
                ("FRA","SOF","DLH",185,130m),
                ("AMS","SOF","KLM",200,95m),
                ("IST","SOF","THY",90,65m),
                ("VIE","SOF","AUA",100,69m),
                ("ATH","SOF","LZB",80,55m),
                // Major European routes
                ("LHR","CDG","BAW",75,95m),  ("CDG","LHR","AFR",75,95m),
                ("LHR","FRA","BAW",105,115m),("FRA","LHR","DLH",105,115m),
                ("LHR","AMS","BAW",80,85m),  ("AMS","LHR","KLM",80,85m),
                ("LHR","IST","BAW",210,145m),("IST","LHR","THY",210,145m),
                ("LHR","BCN","EZY",155,75m), ("BCN","LHR","EZY",155,75m),
                ("LHR","FCO","BAW",160,125m),("FCO","LHR","BAW",160,125m),
                ("LHR","MAD","BAW",155,115m),("MAD","LHR","BAW",155,115m),
                ("CDG","FRA","AFR",90,89m),  ("FRA","CDG","DLH",90,89m),
                ("CDG","AMS","AFR",75,79m),  ("AMS","CDG","KLM",75,79m),
                ("CDG","IST","AFR",195,129m),("IST","CDG","THY",195,129m),
                ("CDG","BCN","TVF",115,69m), ("BCN","CDG","TVF",115,69m),
                ("FRA","AMS","DLH",75,89m),  ("AMS","FRA","KLM",75,89m),
                ("FRA","IST","DLH",195,119m),("IST","FRA","THY",195,119m),
                ("FRA","VIE","DLH",110,79m), ("VIE","FRA","AUA",110,79m),
                ("FRA","ATH","DLH",195,109m),("ATH","FRA","DLH",195,109m),
                ("AMS","IST","KLM",215,115m),("IST","AMS","THY",215,115m),
                ("AMS","BCN","KLM",150,89m), ("BCN","AMS","KLM",150,89m),
                ("IST","ATH","THY",95,75m),  ("ATH","IST","THY",95,75m),
                ("IST","VIE","THY",165,99m), ("VIE","IST","AUA",165,99m),
                ("BCN","FCO","EZY",105,59m), ("FCO","BCN","EZY",105,59m),
                ("BCN","MAD","EZY",75,45m),  ("MAD","BCN","EZY",75,45m),
                ("VIE","ATH","AUA",150,89m), ("ATH","VIE","AUA",150,89m),
                ("MUC","VIE","DLH",60,65m),  ("VIE","MUC","AUA",60,65m),
                ("ZRH","FRA","SWR",60,59m),  ("FRA","ZRH","DLH",60,59m),
                ("WAW","FRA","LOT",120,89m), ("FRA","WAW","DLH",120,89m),
                ("WAW","VIE","LOT",100,75m), ("VIE","WAW","AUA",100,75m),
                ("CPH","LHR","SAS",115,99m), ("LHR","CPH","BAW",115,99m),
                ("CPH","FRA","SAS",100,85m), ("FRA","CPH","DLH",100,85m),
                ("OSL","LHR","SAS",135,109m),("LHR","OSL","BAW",135,109m),
                ("MXP","LHR","EJU",130,79m), ("LHR","MXP","BAW",130,79m),
                ("MXP","CDG","EJU",85,65m),  ("CDG","MXP","AFR",85,65m),
                ("ATH","CDG","AFR",205,119m),("CDG","ATH","AFR",205,119m),
                ("ATH","AMS","KLM",220,125m),("AMS","ATH","KLM",220,125m),
                ("PRG","LHR","EZY",130,69m), ("LHR","PRG","EZY",130,69m),
                ("PRG","FRA","DLH",80,59m),  ("FRA","PRG","DLH",80,59m),
                ("BUD","LHR","WZZ",150,59m), ("LHR","BUD","WZZ",150,59m),
                ("BUD","FRA","WZZ",110,49m), ("FRA","BUD","DLH",110,79m),
            };

            var rng = new Random(42);
            var baseDate = DateTime.UtcNow.Date.AddDays(3);
            var flights = new List<Flight>();
            var counter = 1;
            int[] hours = { 6, 10, 14, 18, 21 };

            foreach (var r in routes)
            {
                if (!airports.TryGetValue(r.F, out int fromId)) continue;
                if (!airports.TryGetValue(r.T, out int toId)) continue;
                airlines.TryGetValue(r.AL, out var airline);

                for (int d = 0; d < 90; d += 7)
                {
                    foreach (var h in hours)
                    {
                        var dep = baseDate.AddDays(d + rng.Next(0, 3))
                                          .AddHours(h).AddMinutes(rng.Next(0, 45));
                        var arr = dep.AddMinutes(r.Dur + rng.Next(-5, 20));
                        var factor = 0.8 + rng.NextDouble() * 0.6;
                        var price = Math.Round(Math.Max(19m, r.Price * (decimal)factor), 2);
                        var smart = 40 + rng.NextDouble() * 55;

                        flights.Add(new Flight
                        {
                            FlightNumber = $"{r.AL}{counter++:D4}",
                            AirlineId = airline?.Id,
                            DepartureAirportId = fromId,
                            ArrivalAirportId = toId,
                            DepartureTime = dep,
                            ArrivalTime = arr,
                            Price = price,
                            LastUpdated = DateTime.UtcNow,
                            Analytics = new FlightAnalytics
                            {
                                BasePrice = r.Price,
                                DelayProbability = rng.NextDouble() * 0.35,
                                PredictedDelayMinutes = rng.Next(0, 40),
                                Co2Emissions = r.Dur * 0.14 + rng.NextDouble() * 15,
                                FuelEfficiency = 75 + rng.NextDouble() * 25,
                                SmartScore = smart,
                                IsEcoFriendly = smart > 70,
                                IsBestValue = price < r.Price * 0.95m,
                            }
                        });
                    }
                }
            }

            await context.Flights.AddRangeAsync(flights);
            await context.SaveChangesAsync();
        }

        public static async Task SeedSofiaExtendedFlightsAsync(FlightPlannerDbContext context)
        {
            var cutoff = new DateTime(2026, 6, 25, 0, 0, 0, DateTimeKind.Utc);

            var existingCount = await context.Flights
                .Include(f => f.DepartureAirport)
                .CountAsync(f => f.DepartureAirport.IataCode == "SOF" && f.DepartureTime >= cutoff);
            if (existingCount >= 1000) return;

            var sofAirport = await context.Airports.FirstOrDefaultAsync(a => a.IataCode == "SOF");
            if (sofAirport == null) return;

            var destCodes = new[] { "LHR", "CDG", "FRA", "AMS", "IST", "VIE", "MUC", "ZRH", "WAW", "BCN", "FCO", "MAD", "ATH", "PRG", "DUB", "CPH", "BUD", "OSL", "MXP" };
            var destAirports = await context.Airports
                .Where(a => a.IataCode != null && destCodes.Contains(a.IataCode))
                .ToDictionaryAsync(a => a.IataCode!, a => a);

            var airlines = await context.Airlines.ToDictionaryAsync(a => a.IcaoCode, a => a);

            // (destination IATA, airline ICAO, duration mins, base price EUR)
            var routes = new (string Dest, string Al, int Dur, decimal Price)[]
            {
                ("LHR","LZB",175,89m),  ("LHR","WZZ",175,72m),  ("LHR","EZY",175,68m),
                ("CDG","LZB",195,95m),  ("CDG","AFR",195,115m), ("CDG","WZZ",195,79m),
                ("FRA","LZB",185,88m),  ("FRA","DLH",185,130m), ("FRA","WZZ",185,74m),
                ("AMS","KLM",200,95m),  ("AMS","WZZ",200,72m),  ("AMS","LZB",200,89m),
                ("IST","LZB",90,55m),   ("IST","THY",90,65m),   ("IST","BGH",90,49m),
                ("VIE","AUA",100,69m),  ("VIE","WZZ",100,45m),  ("VIE","LZB",100,62m),
                ("MUC","DLH",150,89m),  ("MUC","LZB",150,79m),  ("MUC","WZZ",150,65m),
                ("ZRH","SWR",165,105m), ("ZRH","WZZ",165,85m),  ("ZRH","LZB",165,99m),
                ("WAW","LOT",145,72m),  ("WAW","WZZ",145,49m),  ("WAW","LZB",145,68m),
                ("BCN","WZZ",225,65m),  ("BCN","EZY",225,72m),  ("BCN","LZB",225,79m),
                ("FCO","WZZ",160,59m),  ("FCO","EZY",160,65m),  ("FCO","LZB",160,74m),
                ("MAD","WZZ",260,79m),  ("MAD","EZY",260,85m),  ("MAD","LZB",260,95m),
                ("ATH","LZB",80,55m),   ("ATH","BGH",80,49m),   ("ATH","WZZ",80,44m),
                ("PRG","WZZ",145,49m),  ("PRG","EZY",145,55m),  ("PRG","LZB",145,62m),
                ("DUB","RYR",270,45m),  ("DUB","WZZ",270,55m),  ("DUB","LZB",270,79m),
                ("CPH","SAS",195,89m),  ("CPH","WZZ",195,72m),  ("CPH","LZB",195,85m),
                ("BUD","WZZ",100,39m),  ("BUD","BGH",100,44m),  ("BUD","LZB",100,55m),
                ("OSL","WZZ",230,79m),  ("OSL","SAS",230,99m),  ("OSL","LZB",230,89m),
                ("MXP","WZZ",180,59m),  ("MXP","EZY",180,65m),  ("MXP","LZB",180,74m),
            };

            var rng = new Random(1337);
            int[] hours = { 6, 11, 16, 20 };
            var flights = new List<Flight>();
            var counter = 20000;

            // 26 weeks (~6 months) of flights from 25.06.2026
            for (int week = 0; week < 26; week++)
            {
                for (int ri = 0; ri < routes.Length; ri++)
                {
                    var r = routes[ri];
                    if (!destAirports.TryGetValue(r.Dest, out var destAirport)) continue;
                    airlines.TryGetValue(r.Al, out var airline);

                    // Rotate which departure slot is skipped so not every airline flies at identical times
                    int skipSlot = (week + ri) % 4;

                    for (int si = 0; si < hours.Length; si++)
                    {
                        if (si == skipSlot) continue;
                        var h = hours[si];

                        var dep = cutoff
                            .AddDays(week * 7 + rng.Next(0, 3))
                            .AddHours(h)
                            .AddMinutes(rng.Next(0, 55));
                        var arr = dep.AddMinutes(r.Dur + rng.Next(-5, 25));
                        var factor = 0.75 + rng.NextDouble() * 0.65;
                        var price = Math.Round(Math.Max(19m, r.Price * (decimal)factor), 2);
                        var smart = 35 + rng.NextDouble() * 60;

                        flights.Add(new Flight
                        {
                            FlightNumber = $"{r.Al}{counter++:D5}",
                            AirlineId = airline?.Id,
                            DepartureAirportId = sofAirport.Id,
                            ArrivalAirportId = destAirport.Id,
                            DepartureTime = dep,
                            ArrivalTime = arr,
                            Price = price,
                            LastUpdated = DateTime.UtcNow,
                            Analytics = new FlightAnalytics
                            {
                                BasePrice = r.Price,
                                DelayProbability = rng.NextDouble() * 0.35,
                                PredictedDelayMinutes = rng.Next(0, 45),
                                Co2Emissions = r.Dur * 0.14 + rng.NextDouble() * 15,
                                FuelEfficiency = 75 + rng.NextDouble() * 25,
                                SmartScore = smart,
                                IsEcoFriendly = smart > 70,
                                IsBestValue = price < r.Price * 0.95m,
                            }
                        });
                    }
                }
            }

            await context.Flights.AddRangeAsync(flights);
            await context.SaveChangesAsync();
            Console.WriteLine($"[Seed] Added {flights.Count} extended SOF flights starting 25.06.2026.");
        }
    }
}
