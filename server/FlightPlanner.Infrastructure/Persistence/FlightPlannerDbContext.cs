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

        public static async Task SeedMassEuropeanFlightsAsync(FlightPlannerDbContext context)
        {
            var periodStart = new DateTime(2026, 7, 1, 0, 0, 0, DateTimeKind.Utc);
            var periodEnd   = new DateTime(2027, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var existing = await context.Flights
                .CountAsync(f => f.DepartureTime >= periodStart && f.DepartureTime < periodEnd);
            if (existing >= 10_000) return;

            var iataCodes = new[] {
                "SOF","LHR","CDG","FRA","AMS","IST","VIE","MUC","ZRH",
                "WAW","BCN","FCO","MAD","ATH","PRG","DUB","CPH","BUD","OSL","MXP"
            };
            var apMap = await context.Airports
                .Where(a => a.IataCode != null && iataCodes.Contains(a.IataCode))
                .ToDictionaryAsync(a => a.IataCode!, a => a.Id);
            var alMap = await context.Airlines.ToDictionaryAsync(a => a.IcaoCode, a => a);

            // (from, to, durationMins, basePrice, airlines[])
            var routes = new (string F, string T, int D, decimal P, string[] Als)[]
            {
                // ── SOF outbound ──
                ("SOF","LHR",175, 89m, new[]{"LZB","WZZ","EZY","BAW"}),
                ("SOF","CDG",195, 95m, new[]{"LZB","AFR","WZZ","TVF"}),
                ("SOF","FRA",185, 88m, new[]{"LZB","DLH","WZZ"}),
                ("SOF","AMS",200, 95m, new[]{"LZB","KLM","WZZ"}),
                ("SOF","IST", 90, 55m, new[]{"LZB","THY","BGH","PGT"}),
                ("SOF","VIE",100, 69m, new[]{"LZB","AUA","WZZ"}),
                ("SOF","MUC",150, 89m, new[]{"LZB","DLH","WZZ"}),
                ("SOF","ZRH",165,105m, new[]{"LZB","SWR","WZZ"}),
                ("SOF","WAW",145, 72m, new[]{"LZB","LOT","WZZ"}),
                ("SOF","BCN",225, 65m, new[]{"LZB","WZZ","EZY","RYR"}),
                ("SOF","FCO",160, 59m, new[]{"LZB","WZZ","EZY"}),
                ("SOF","MAD",260, 79m, new[]{"LZB","WZZ","EZY"}),
                ("SOF","ATH", 80, 55m, new[]{"LZB","BGH","WZZ"}),
                ("SOF","PRG",145, 49m, new[]{"LZB","WZZ","EZY"}),
                ("SOF","DUB",270, 45m, new[]{"LZB","RYR","WZZ"}),
                ("SOF","CPH",195, 89m, new[]{"LZB","SAS","WZZ"}),
                ("SOF","BUD",100, 39m, new[]{"LZB","WZZ","BGH"}),
                ("SOF","OSL",230, 79m, new[]{"LZB","SAS","WZZ"}),
                ("SOF","MXP",180, 59m, new[]{"LZB","WZZ","EZY"}),
                // ── SOF inbound (returns) ──
                ("LHR","SOF",175, 89m, new[]{"LZB","WZZ","EZY","BAW"}),
                ("CDG","SOF",195, 95m, new[]{"LZB","AFR","WZZ","TVF"}),
                ("FRA","SOF",185, 88m, new[]{"LZB","DLH","WZZ"}),
                ("AMS","SOF",200, 95m, new[]{"LZB","KLM","WZZ"}),
                ("IST","SOF", 90, 55m, new[]{"LZB","THY","BGH","PGT"}),
                ("VIE","SOF",100, 69m, new[]{"LZB","AUA","WZZ"}),
                ("MUC","SOF",150, 89m, new[]{"LZB","DLH","WZZ"}),
                ("ZRH","SOF",165,105m, new[]{"LZB","SWR","WZZ"}),
                ("WAW","SOF",145, 72m, new[]{"LZB","LOT","WZZ"}),
                ("BCN","SOF",225, 65m, new[]{"LZB","WZZ","EZY","RYR"}),
                ("FCO","SOF",160, 59m, new[]{"LZB","WZZ","EZY"}),
                ("MAD","SOF",260, 79m, new[]{"LZB","WZZ","EZY"}),
                ("ATH","SOF", 80, 55m, new[]{"LZB","BGH","WZZ"}),
                ("PRG","SOF",145, 49m, new[]{"LZB","WZZ","EZY"}),
                ("DUB","SOF",270, 45m, new[]{"LZB","RYR","WZZ"}),
                ("CPH","SOF",195, 89m, new[]{"LZB","SAS","WZZ"}),
                ("BUD","SOF",100, 39m, new[]{"LZB","WZZ","BGH"}),
                ("OSL","SOF",230, 79m, new[]{"LZB","SAS","WZZ"}),
                ("MXP","SOF",180, 59m, new[]{"LZB","WZZ","EZY"}),
                // ── London hub ──
                ("LHR","CDG", 75, 95m, new[]{"BAW","AFR","EZY"}),
                ("CDG","LHR", 75, 95m, new[]{"BAW","AFR","EZY"}),
                ("LHR","FRA",105,115m, new[]{"BAW","DLH","EZY"}),
                ("FRA","LHR",105,115m, new[]{"BAW","DLH","EZY"}),
                ("LHR","AMS", 80, 85m, new[]{"BAW","KLM","EZY"}),
                ("AMS","LHR", 80, 85m, new[]{"BAW","KLM","EZY"}),
                ("LHR","IST",210,145m, new[]{"BAW","THY","PGT"}),
                ("IST","LHR",210,145m, new[]{"BAW","THY","PGT"}),
                ("LHR","BCN",155, 75m, new[]{"BAW","EZY","RYR"}),
                ("BCN","LHR",155, 75m, new[]{"BAW","EZY","RYR"}),
                ("LHR","FCO",160,125m, new[]{"BAW","EZY","RYR"}),
                ("FCO","LHR",160,125m, new[]{"BAW","EZY","RYR"}),
                ("LHR","MAD",155,115m, new[]{"BAW","EZY","RYR"}),
                ("MAD","LHR",155,115m, new[]{"BAW","EZY","RYR"}),
                ("LHR","ATH",215,135m, new[]{"BAW","EZY"}),
                ("ATH","LHR",215,135m, new[]{"BAW","EZY"}),
                ("LHR","PRG",130, 69m, new[]{"BAW","EZY","RYR"}),
                ("PRG","LHR",130, 69m, new[]{"BAW","EZY","RYR"}),
                ("LHR","DUB", 90, 65m, new[]{"BAW","RYR","EZY"}),
                ("DUB","LHR", 90, 65m, new[]{"BAW","RYR","EZY"}),
                ("LHR","CPH",115, 99m, new[]{"BAW","SAS","EZY"}),
                ("CPH","LHR",115, 99m, new[]{"BAW","SAS","EZY"}),
                ("LHR","BUD",150, 59m, new[]{"BAW","WZZ","RYR"}),
                ("BUD","LHR",150, 59m, new[]{"BAW","WZZ","RYR"}),
                ("LHR","OSL",135,109m, new[]{"BAW","SAS","EZY"}),
                ("OSL","LHR",135,109m, new[]{"BAW","SAS","EZY"}),
                ("LHR","MXP",130, 79m, new[]{"BAW","EZY","RYR"}),
                ("MXP","LHR",130, 79m, new[]{"BAW","EZY","RYR"}),
                ("LHR","VIE",145,109m, new[]{"BAW","AUA","EZY"}),
                ("VIE","LHR",145,109m, new[]{"BAW","AUA","EZY"}),
                ("LHR","ZRH",100,119m, new[]{"BAW","SWR","EZY"}),
                ("ZRH","LHR",100,119m, new[]{"BAW","SWR","EZY"}),
                ("LHR","WAW",160, 89m, new[]{"BAW","LOT","WZZ"}),
                ("WAW","LHR",160, 89m, new[]{"BAW","LOT","WZZ"}),
                ("LHR","MUC",125,109m, new[]{"BAW","DLH","EZY"}),
                ("MUC","LHR",125,109m, new[]{"BAW","DLH","EZY"}),
                // ── Frankfurt hub ──
                ("FRA","CDG", 90, 89m, new[]{"DLH","AFR"}),
                ("CDG","FRA", 90, 89m, new[]{"DLH","AFR"}),
                ("FRA","AMS", 75, 89m, new[]{"DLH","KLM"}),
                ("AMS","FRA", 75, 89m, new[]{"DLH","KLM"}),
                ("FRA","IST",195,119m, new[]{"DLH","THY","PGT"}),
                ("IST","FRA",195,119m, new[]{"DLH","THY","PGT"}),
                ("FRA","VIE",110, 79m, new[]{"DLH","AUA"}),
                ("VIE","FRA",110, 79m, new[]{"DLH","AUA"}),
                ("FRA","ATH",195,109m, new[]{"DLH","EZY"}),
                ("ATH","FRA",195,109m, new[]{"DLH","EZY"}),
                ("FRA","BCN",160, 89m, new[]{"DLH","EZY","RYR"}),
                ("BCN","FRA",160, 89m, new[]{"DLH","EZY","RYR"}),
                ("FRA","FCO",135, 99m, new[]{"DLH","EZY","RYR"}),
                ("FCO","FRA",135, 99m, new[]{"DLH","EZY","RYR"}),
                ("FRA","MAD",180,109m, new[]{"DLH","EZY"}),
                ("MAD","FRA",180,109m, new[]{"DLH","EZY"}),
                ("FRA","PRG", 80, 59m, new[]{"DLH","EZY"}),
                ("PRG","FRA", 80, 59m, new[]{"DLH","EZY"}),
                ("FRA","CPH",100, 85m, new[]{"DLH","SAS"}),
                ("CPH","FRA",100, 85m, new[]{"DLH","SAS"}),
                ("FRA","WAW",120, 89m, new[]{"DLH","LOT"}),
                ("WAW","FRA",120, 89m, new[]{"DLH","LOT"}),
                ("FRA","BUD",110, 79m, new[]{"DLH","WZZ"}),
                ("BUD","FRA",110, 79m, new[]{"DLH","WZZ"}),
                ("FRA","OSL",135, 95m, new[]{"DLH","SAS"}),
                ("OSL","FRA",135, 95m, new[]{"DLH","SAS"}),
                ("FRA","DUB",140, 89m, new[]{"DLH","RYR"}),
                ("DUB","FRA",140, 89m, new[]{"DLH","RYR"}),
                ("FRA","ZRH", 60, 59m, new[]{"DLH","SWR"}),
                ("ZRH","FRA", 60, 59m, new[]{"DLH","SWR"}),
                ("FRA","MUC", 70, 55m, new[]{"DLH","EZY"}),
                ("MUC","FRA", 70, 55m, new[]{"DLH","EZY"}),
                ("FRA","MXP", 85, 65m, new[]{"DLH","EZY"}),
                ("MXP","FRA", 85, 65m, new[]{"DLH","EZY"}),
                // ── Paris hub ──
                ("CDG","AMS", 75, 79m, new[]{"AFR","KLM","EZY"}),
                ("AMS","CDG", 75, 79m, new[]{"AFR","KLM","EZY"}),
                ("CDG","IST",195,129m, new[]{"AFR","THY","PGT"}),
                ("IST","CDG",195,129m, new[]{"AFR","THY","PGT"}),
                ("CDG","BCN",115, 69m, new[]{"AFR","TVF","EZY","RYR"}),
                ("BCN","CDG",115, 69m, new[]{"AFR","TVF","EZY","RYR"}),
                ("CDG","FCO",135, 99m, new[]{"AFR","EZY"}),
                ("FCO","CDG",135, 99m, new[]{"AFR","EZY"}),
                ("CDG","MAD",130, 89m, new[]{"AFR","TVF","EZY"}),
                ("MAD","CDG",130, 89m, new[]{"AFR","TVF","EZY"}),
                ("CDG","ATH",205,119m, new[]{"AFR","EZY"}),
                ("ATH","CDG",205,119m, new[]{"AFR","EZY"}),
                ("CDG","DUB",120, 79m, new[]{"AFR","RYR","EZY"}),
                ("DUB","CDG",120, 79m, new[]{"AFR","RYR","EZY"}),
                ("CDG","CPH",135, 95m, new[]{"AFR","SAS"}),
                ("CPH","CDG",135, 95m, new[]{"AFR","SAS"}),
                ("CDG","VIE",145, 99m, new[]{"AFR","AUA"}),
                ("VIE","CDG",145, 99m, new[]{"AFR","AUA"}),
                ("CDG","MXP", 85, 65m, new[]{"AFR","EZY","RYR"}),
                ("MXP","CDG", 85, 65m, new[]{"AFR","EZY","RYR"}),
                ("CDG","MUC",105, 89m, new[]{"AFR","DLH","EZY"}),
                ("MUC","CDG",105, 89m, new[]{"AFR","DLH","EZY"}),
                ("CDG","WAW",155, 99m, new[]{"AFR","LOT"}),
                ("WAW","CDG",155, 99m, new[]{"AFR","LOT"}),
                ("CDG","BUD",145, 89m, new[]{"AFR","WZZ"}),
                ("BUD","CDG",145, 89m, new[]{"AFR","WZZ"}),
                // ── Amsterdam hub ──
                ("AMS","IST",215,115m, new[]{"KLM","THY"}),
                ("IST","AMS",215,115m, new[]{"KLM","THY"}),
                ("AMS","BCN",150, 89m, new[]{"KLM","EZY","RYR"}),
                ("BCN","AMS",150, 89m, new[]{"KLM","EZY","RYR"}),
                ("AMS","FCO",155, 95m, new[]{"KLM","EZY"}),
                ("FCO","AMS",155, 95m, new[]{"KLM","EZY"}),
                ("AMS","ATH",220,125m, new[]{"KLM","EZY"}),
                ("ATH","AMS",220,125m, new[]{"KLM","EZY"}),
                ("AMS","DUB",110, 79m, new[]{"KLM","RYR","EZY"}),
                ("DUB","AMS",110, 79m, new[]{"KLM","RYR","EZY"}),
                ("AMS","CPH", 90, 75m, new[]{"KLM","SAS"}),
                ("CPH","AMS", 90, 75m, new[]{"KLM","SAS"}),
                ("AMS","VIE",130, 89m, new[]{"KLM","AUA"}),
                ("VIE","AMS",130, 89m, new[]{"KLM","AUA"}),
                ("AMS","WAW",155, 89m, new[]{"KLM","LOT"}),
                ("WAW","AMS",155, 89m, new[]{"KLM","LOT"}),
                ("AMS","MAD",195, 99m, new[]{"KLM","EZY"}),
                ("MAD","AMS",195, 99m, new[]{"KLM","EZY"}),
                ("AMS","OSL",130, 89m, new[]{"KLM","SAS"}),
                ("OSL","AMS",130, 89m, new[]{"KLM","SAS"}),
                ("AMS","MUC",115, 79m, new[]{"KLM","DLH"}),
                ("MUC","AMS",115, 79m, new[]{"KLM","DLH"}),
                // ── Istanbul hub ──
                ("IST","BCN",250,135m, new[]{"THY","PGT"}),
                ("BCN","IST",250,135m, new[]{"THY","PGT"}),
                ("IST","FCO",195,119m, new[]{"THY","PGT"}),
                ("FCO","IST",195,119m, new[]{"THY","PGT"}),
                ("IST","ATH", 95, 75m, new[]{"THY","EZY","BGH"}),
                ("ATH","IST", 95, 75m, new[]{"THY","EZY","BGH"}),
                ("IST","VIE",165, 99m, new[]{"THY","AUA","PGT"}),
                ("VIE","IST",165, 99m, new[]{"THY","AUA","PGT"}),
                ("IST","PRG",195,109m, new[]{"THY","WZZ"}),
                ("PRG","IST",195,109m, new[]{"THY","WZZ"}),
                ("IST","BUD",160, 89m, new[]{"THY","WZZ","PGT"}),
                ("BUD","IST",160, 89m, new[]{"THY","WZZ","PGT"}),
                ("IST","WAW",210,115m, new[]{"THY","LOT"}),
                ("WAW","IST",210,115m, new[]{"THY","LOT"}),
                ("IST","MAD",270,139m, new[]{"THY","PGT"}),
                ("MAD","IST",270,139m, new[]{"THY","PGT"}),
                ("IST","OSL",290,149m, new[]{"THY","SAS"}),
                ("OSL","IST",290,149m, new[]{"THY","SAS"}),
                ("IST","CPH",270,139m, new[]{"THY","SAS"}),
                ("CPH","IST",270,139m, new[]{"THY","SAS"}),
                // ── Iberian routes ──
                ("BCN","FCO",105, 59m, new[]{"EZY","RYR","TVF"}),
                ("FCO","BCN",105, 59m, new[]{"EZY","RYR","TVF"}),
                ("BCN","MAD", 75, 45m, new[]{"EZY","RYR"}),
                ("MAD","BCN", 75, 45m, new[]{"EZY","RYR"}),
                ("BCN","ATH",205, 99m, new[]{"EZY","RYR"}),
                ("ATH","BCN",205, 99m, new[]{"EZY","RYR"}),
                ("BCN","DUB",160, 69m, new[]{"EZY","RYR"}),
                ("DUB","BCN",160, 69m, new[]{"EZY","RYR"}),
                ("BCN","CPH",175, 99m, new[]{"SAS","EZY"}),
                ("CPH","BCN",175, 99m, new[]{"SAS","EZY"}),
                ("BCN","OSL",205,109m, new[]{"SAS","EZY"}),
                ("OSL","BCN",205,109m, new[]{"SAS","EZY"}),
                ("BCN","VIE",175, 89m, new[]{"AUA","EZY","WZZ"}),
                ("VIE","BCN",175, 89m, new[]{"AUA","EZY","WZZ"}),
                ("MAD","FCO",155, 89m, new[]{"EZY","RYR"}),
                ("FCO","MAD",155, 89m, new[]{"EZY","RYR"}),
                ("MAD","ATH",225,109m, new[]{"EZY","RYR"}),
                ("ATH","MAD",225,109m, new[]{"EZY","RYR"}),
                ("MAD","DUB",155, 79m, new[]{"EZY","RYR"}),
                ("DUB","MAD",155, 79m, new[]{"EZY","RYR"}),
                ("MAD","MXP",140, 79m, new[]{"EZY","RYR"}),
                ("MXP","MAD",140, 79m, new[]{"EZY","RYR"}),
                // ── Central / Eastern Europe ──
                ("VIE","ATH",150, 89m, new[]{"AUA","EZY"}),
                ("ATH","VIE",150, 89m, new[]{"AUA","EZY"}),
                ("VIE","FCO",110, 79m, new[]{"AUA","EZY","RYR"}),
                ("FCO","VIE",110, 79m, new[]{"AUA","EZY","RYR"}),
                ("VIE","PRG", 70, 49m, new[]{"AUA","WZZ"}),
                ("PRG","VIE", 70, 49m, new[]{"AUA","WZZ"}),
                ("VIE","BUD", 45, 35m, new[]{"AUA","WZZ"}),
                ("BUD","VIE", 45, 35m, new[]{"AUA","WZZ"}),
                ("VIE","MUC", 60, 65m, new[]{"AUA","DLH"}),
                ("MUC","VIE", 60, 65m, new[]{"AUA","DLH"}),
                ("VIE","WAW",100, 75m, new[]{"AUA","LOT"}),
                ("WAW","VIE",100, 75m, new[]{"AUA","LOT"}),
                ("VIE","CPH",145, 89m, new[]{"AUA","SAS"}),
                ("CPH","VIE",145, 89m, new[]{"AUA","SAS"}),
                ("MUC","ZRH", 60, 55m, new[]{"DLH","SWR"}),
                ("ZRH","MUC", 60, 55m, new[]{"DLH","SWR"}),
                ("MUC","BCN",160, 89m, new[]{"DLH","EZY","RYR"}),
                ("BCN","MUC",160, 89m, new[]{"DLH","EZY","RYR"}),
                ("MUC","FCO",110, 79m, new[]{"DLH","EZY"}),
                ("FCO","MUC",110, 79m, new[]{"DLH","EZY"}),
                ("MUC","MAD",185, 99m, new[]{"DLH","EZY"}),
                ("MAD","MUC",185, 99m, new[]{"DLH","EZY"}),
                ("MUC","ATH",175, 89m, new[]{"DLH","EZY"}),
                ("ATH","MUC",175, 89m, new[]{"DLH","EZY"}),
                ("PRG","WAW",105, 59m, new[]{"LOT","WZZ"}),
                ("WAW","PRG",105, 59m, new[]{"LOT","WZZ"}),
                ("PRG","BUD", 90, 45m, new[]{"WZZ","EZY"}),
                ("BUD","PRG", 90, 45m, new[]{"WZZ","EZY"}),
                ("WAW","BUD",135, 65m, new[]{"LOT","WZZ"}),
                ("BUD","WAW",135, 65m, new[]{"LOT","WZZ"}),
                ("WAW","CPH",115, 79m, new[]{"LOT","SAS"}),
                ("CPH","WAW",115, 79m, new[]{"LOT","SAS"}),
                ("WAW","DUB",175, 89m, new[]{"LOT","RYR"}),
                ("DUB","WAW",175, 89m, new[]{"LOT","RYR"}),
                ("WAW","OSL",115, 79m, new[]{"LOT","SAS"}),
                ("OSL","WAW",115, 79m, new[]{"LOT","SAS"}),
                // ── Scandinavian ──
                ("CPH","OSL", 60, 49m, new[]{"SAS","EZY"}),
                ("OSL","CPH", 60, 49m, new[]{"SAS","EZY"}),
                ("CPH","DUB",130, 89m, new[]{"SAS","RYR"}),
                ("DUB","CPH",130, 89m, new[]{"SAS","RYR"}),
                ("OSL","DUB",155, 99m, new[]{"SAS","RYR"}),
                ("DUB","OSL",155, 99m, new[]{"SAS","RYR"}),
                ("CPH","MXP",165, 95m, new[]{"SAS","EZY"}),
                ("MXP","CPH",165, 95m, new[]{"SAS","EZY"}),
                ("OSL","MXP",185,105m, new[]{"SAS","EZY"}),
                ("MXP","OSL",185,105m, new[]{"SAS","EZY"}),
                // ── Italy / Switzerland ──
                ("FCO","ATH",135, 69m, new[]{"EZY","RYR"}),
                ("ATH","FCO",135, 69m, new[]{"EZY","RYR"}),
                ("MXP","ATH",165, 79m, new[]{"EZY","RYR"}),
                ("ATH","MXP",165, 79m, new[]{"EZY","RYR"}),
                ("MXP","ZRH", 45, 39m, new[]{"EZY","SWR"}),
                ("ZRH","MXP", 45, 39m, new[]{"EZY","SWR"}),
                ("MXP","BCN", 95, 59m, new[]{"EZY","RYR","TVF"}),
                ("BCN","MXP", 95, 59m, new[]{"EZY","RYR","TVF"}),
                ("FCO","DUB",180, 79m, new[]{"EZY","RYR"}),
                ("DUB","FCO",180, 79m, new[]{"EZY","RYR"}),
                ("MXP","DUB",155, 69m, new[]{"EZY","RYR"}),
                ("DUB","MXP",155, 69m, new[]{"EZY","RYR"}),
                ("FCO","PRG",155, 69m, new[]{"EZY","RYR"}),
                ("PRG","FCO",155, 69m, new[]{"EZY","RYR"}),
                ("MXP","PRG",110, 59m, new[]{"EZY","WZZ"}),
                ("PRG","MXP",110, 59m, new[]{"EZY","WZZ"}),
                ("ZRH","BCN",145, 79m, new[]{"SWR","EZY"}),
                ("BCN","ZRH",145, 79m, new[]{"SWR","EZY"}),
                ("ZRH","MAD",165, 89m, new[]{"SWR","EZY"}),
                ("MAD","ZRH",165, 89m, new[]{"SWR","EZY"}),
                ("ZRH","ATH",185, 99m, new[]{"SWR","EZY"}),
                ("ATH","ZRH",185, 99m, new[]{"SWR","EZY"}),
                ("ZRH","VIE", 80, 59m, new[]{"SWR","AUA"}),
                ("VIE","ZRH", 80, 59m, new[]{"SWR","AUA"}),
            };

            var rng     = new Random(7777);
            var flights = new List<Flight>();
            var counter = 200000;
            int[] slots    = { 6, 8, 10, 12, 14, 16, 18, 20 };
            int   totalDays = (int)(periodEnd - periodStart).TotalDays; // 184

            foreach (var (from, to, dur, baseP, als) in routes)
            {
                if (!apMap.TryGetValue(from, out int fromId)) continue;
                if (!apMap.TryGetValue(to,   out int toId))   continue;

                foreach (var alCode in als)
                {
                    alMap.TryGetValue(alCode, out var airline);

                    // Weekly service with a random start offset per airline
                    for (int d = rng.Next(0, 4); d < totalDays; d += 7)
                    {
                        int numSlots = rng.Next(1, 3);
                        var chosenSlots = slots
                            .OrderBy(_ => rng.Next())
                            .Take(numSlots)
                            .OrderBy(s => s)
                            .ToArray();

                        foreach (var h in chosenSlots)
                        {
                            var dep = periodStart
                                .AddDays(d)
                                .AddHours(h)
                                .AddMinutes(rng.Next(0, 55));
                            var arr    = dep.AddMinutes(dur + rng.Next(-5, 25));
                            var factor = 0.75 + rng.NextDouble() * 0.65;
                            var price  = Math.Round(Math.Max(19m, baseP * (decimal)factor), 2);
                            var smart  = 30 + rng.NextDouble() * 65;

                            flights.Add(new Flight
                            {
                                FlightNumber       = $"{alCode}{counter++:D6}",
                                AirlineId          = airline?.Id,
                                DepartureAirportId = fromId,
                                ArrivalAirportId   = toId,
                                DepartureTime      = dep,
                                ArrivalTime        = arr,
                                Price              = price,
                                LastUpdated        = DateTime.UtcNow,
                                Analytics = new FlightAnalytics
                                {
                                    BasePrice             = baseP,
                                    DelayProbability      = rng.NextDouble() * 0.35,
                                    PredictedDelayMinutes = rng.Next(0, 45),
                                    Co2Emissions          = dur * 0.14 + rng.NextDouble() * 15,
                                    FuelEfficiency        = 75 + rng.NextDouble() * 25,
                                    SmartScore            = smart,
                                    IsEcoFriendly         = smart > 70,
                                    IsBestValue           = price < baseP * 0.95m,
                                }
                            });
                        }
                    }
                }
            }

            const int batchSize = 2000;
            for (int i = 0; i < flights.Count; i += batchSize)
            {
                await context.Flights.AddRangeAsync(flights.Skip(i).Take(batchSize));
                await context.SaveChangesAsync();
            }

            Console.WriteLine($"[Seed] Added {flights.Count} mass European flights (Jul–Dec 2026).");
        }
    }
}
