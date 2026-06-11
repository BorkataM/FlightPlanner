using FlightPlanner.Core.Interfaces;
using FlightPlanner.Core.Services;
using FlightPlanner.Infrastructure.BackgroundServices;
using FlightPlanner.Infrastructure.ExternalClients;
using FlightPlanner.Infrastructure.Persistence;
using FlightPlanner.Infrastructure.Repositories;
using FlightPlanner.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace FlightPlanner.Infrastructure.DependencyInjection
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var rawConnectionString = configuration.GetConnectionString("DefaultConnection");

            var connectionString = rawConnectionString?
                .Replace("${DB_HOST}", Environment.GetEnvironmentVariable("DB_HOST"))
                .Replace("${DB_NAME}", Environment.GetEnvironmentVariable("DB_NAME"))
                .Replace("${DB_USER}", Environment.GetEnvironmentVariable("DB_USER"))
                .Replace("${DB_PASSWORD}", Environment.GetEnvironmentVariable("DB_PASSWORD"));

            services.AddDbContext<FlightPlannerDbContext>(options =>
                options.UseNpgsql(connectionString));

            services.AddScoped<IAirportService, AirportService>();
            services.AddScoped<IAirportRepository, AirportRepository>();

            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IBookingRepository, BookingRepository>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IBookingService, BookingService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
            services.AddScoped<ISocialRepository, SocialRepository>();
            services.AddScoped<ISocialService, SocialService>();

            services.AddScoped<IFlightRepository, FlightRepository>();
            services.AddScoped<IFlightService, FlightService>();

            services.AddSingleton<IRefreshTokenStore, InMemoryRefreshTokenStore>();

            services.AddHttpClient<OpenSkyClient>();
            services.AddHostedService<FlightSyncWorker>();

            var rawAiUrl = configuration["AiService:BaseUrl"] ?? "http://localhost:8000";
            var aiServiceUrl = rawAiUrl.Replace("${AI_SERVICE_URL}", Environment.GetEnvironmentVariable("AI_SERVICE_URL") ?? rawAiUrl);
            services.AddHttpClient<IAiChatService, AiChatClient>(client =>
            {
                client.BaseAddress = new Uri(aiServiceUrl);
                client.Timeout = TimeSpan.FromSeconds(90);
            });

            var rawWeatherKey = configuration["Weather:ApiKey"] ?? "";
            var weatherKey    = rawWeatherKey.Replace("${OPENWEATHER_API_KEY}", Environment.GetEnvironmentVariable("OPENWEATHER_API_KEY") ?? rawWeatherKey);
            var rawWeatherUrl = configuration["Weather:BaseUrl"] ?? "https://api.openweathermap.org";

            services.AddHttpClient("openweather", client =>
            {
                client.BaseAddress = new Uri(rawWeatherUrl);
                client.Timeout     = TimeSpan.FromSeconds(15);
            });
            services.AddScoped<IWeatherService>(sp =>
            {
                var factory  = sp.GetRequiredService<IHttpClientFactory>();
                var http     = factory.CreateClient("openweather");
                var flights  = sp.GetRequiredService<IFlightRepository>();
                return new OpenWeatherClient(http, flights, weatherKey);
            });

            return services;
        }
    }
}