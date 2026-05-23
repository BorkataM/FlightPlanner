using FlightPlanner.Core.Entities;
using FlightPlanner.Infrastructure.ExternalClients;
using FlightPlanner.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace FlightPlanner.Infrastructure.BackgroundServices
{
    public class FlightSyncWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(5);

        public FlightSyncWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await Task.Delay(3000, stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                Console.WriteLine($"--- OpenSky Smart Sync Started at {DateTime.Now} ---");

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var client = scope.ServiceProvider.GetRequiredService<OpenSkyClient>();
                    var context = scope.ServiceProvider.GetRequiredService<FlightPlannerDbContext>();

                    var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
                    await context.Flights
                        .Where(f => f.ArrivalTime < thirtyDaysAgo)
                        .ExecuteDeleteAsync(stoppingToken);

                    var liveFlights = await client.GetFlightsOverEuropeAsync();
                    if (!liveFlights.Any()) continue;

                    var availableAirports = await context.Airports
                        .Where(a => a.IataCode != null && a.IataCode != "")
                        .OrderBy(a => a.Id)
                        .Take(200).ToListAsync(stoppingToken);

                    var airlinesDict = await context.Airlines
                        .ToDictionaryAsync(a => a.IcaoCode, a => a, stoppingToken);

                    var existingFlights = (await context.Flights.ToListAsync(stoppingToken))
                        .GroupBy(f => f.FlightNumber)
                        .ToDictionary(g => g.Key, g => g.OrderByDescending(f => f.LastUpdated).First());

                    var random = new Random();
                    int updatedCount = 0;
                    int addedCount = 0;

                    foreach (var lf in liveFlights.Take(500))
                    {
                        string callsign = lf.FlightNumber.Trim();
                        if (string.IsNullOrEmpty(callsign)) continue;

                        string airlineCode = callsign.Length >= 3 ? callsign.Substring(0, 3).ToUpper() : "UNK";

                        if (existingFlights.TryGetValue(callsign, out var existingFlight))
                        {
                            existingFlight.LastUpdated = DateTime.UtcNow;
                            updatedCount++;
                        }
                        else
                        {
                            var dep = availableAirports[random.Next(availableAirports.Count)];
                            var arr = availableAirports[random.Next(availableAirports.Count)];
                            if (dep.Id == arr.Id) continue;

                            var newFlight = new Flight
                            {
                                FlightNumber = callsign,
                                DepartureAirportId = dep.Id,
                                ArrivalAirportId = arr.Id,
                                DepartureTime = DateTime.UtcNow.AddMinutes(random.Next(10, 60)),
                                ArrivalTime = DateTime.UtcNow.AddHours(random.Next(2, 4)),
                                Price = random.Next(45, 600),
                                LastUpdated = DateTime.UtcNow
                            };

                            if (airlinesDict.TryGetValue(airlineCode, out var airlineEntity))
                            {
                                newFlight.AirlineId = airlineEntity.Id;
                                newFlight.Airline = airlineEntity.Name;
                            }
                            else { newFlight.Airline = airlineCode; }

                            newFlight.Analytics = new FlightAnalytics
                            {
                                BasePrice = newFlight.Price,
                                FuelEfficiency = airlineEntity?.EcoRating ?? 3.0,
                                IsEcoFriendly = airlineEntity?.EcoRating > 4.0,
                                SmartScore = 0.0
                            };

                            context.Flights.Add(newFlight);
                            addedCount++;
                        }
                    }

                    await context.SaveChangesAsync(stoppingToken);
                    Console.WriteLine($"[Worker] Sync complete: {addedCount} added, {updatedCount} updated.");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Worker error]: {ex.Message}");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }
    }
}