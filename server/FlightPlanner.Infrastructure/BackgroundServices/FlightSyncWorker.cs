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
                Console.WriteLine($"--- OpenSky Sync Started at {DateTime.Now} ---");

                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var client = scope.ServiceProvider.GetRequiredService<OpenSkyClient>();
                    var context = scope.ServiceProvider.GetRequiredService<FlightPlannerDbContext>();

                    await context.Flights.ExecuteDeleteAsync(stoppingToken);

                    var liveFlights = await client.GetFlightsOverEuropeAsync();

                    if (liveFlights.Any())
                    {
                        var availableAirports = await context.Airports
                            .Where(a => a.IataCode != null && a.IataCode != "")
                            .Take(200)
                            .ToListAsync(stoppingToken);

                        var airlinesDict = await context.Airlines
                            .ToDictionaryAsync(a => a.IcaoCode, a => a, stoppingToken);

                        var random = new Random();
                        var flightsToSave = new List<Flight>();

                        foreach (var liveFlight in liveFlights.Take(500))
                        {
                            var dep = availableAirports[random.Next(availableAirports.Count)];
                            var arr = availableAirports[random.Next(availableAirports.Count)];
                            if (dep.Id == arr.Id) continue;

                            string callsign = liveFlight.FlightNumber.Trim();
                            string airlineCode = callsign.Length >= 3 ? callsign.Substring(0, 3).ToUpper() : "UNK";

                            var flight = new Flight
                            {
                                FlightNumber = callsign,
                                DepartureAirportId = dep.Id,
                                ArrivalAirportId = arr.Id,
                                DepartureTime = DateTime.UtcNow.AddMinutes(random.Next(5, 60)),
                                ArrivalTime = DateTime.UtcNow.AddHours(random.Next(2, 4)),
                                Price = random.Next(45, 600),
                                LastUpdated = DateTime.UtcNow
                            };

                            if (airlinesDict.TryGetValue(airlineCode, out var airlineEntity))
                            {
                                flight.AirlineId = airlineEntity.Id;
                                flight.Airline = airlineEntity.Name;
                            }
                            else
                            {
                                flight.Airline = airlineCode;
                            }

                            flight.Analytics = new FlightAnalytics
                            {
                                BasePrice = flight.Price,
                                SmartScore = 0.0,
                                IsEcoFriendly = airlineEntity?.EcoRating > 4.0,
                                DelayProbability = 0.0,
                                Co2Emissions = 0.0,
                                FuelEfficiency = airlineEntity?.EcoRating ?? 3.0
                            };

                            flightsToSave.Add(flight);
                        }

                        context.Flights.AddRange(flightsToSave);
                        await context.SaveChangesAsync(stoppingToken);

                        Console.WriteLine($"[Worker] Successfully synced {flightsToSave.Count} flights with analytics placeholders.");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Worker error]: {ex.Message}");
                }

                Console.WriteLine($"--- Waiting {_interval.TotalMinutes} minutes for next sync ---");
                await Task.Delay(_interval, stoppingToken);
            }
        }
    }
}