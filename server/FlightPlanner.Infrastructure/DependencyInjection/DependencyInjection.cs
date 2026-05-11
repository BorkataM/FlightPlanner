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

            services.AddHttpClient<OpenSkyClient>();
            services.AddHostedService<FlightSyncWorker>();

            return services;
        }
    }
}