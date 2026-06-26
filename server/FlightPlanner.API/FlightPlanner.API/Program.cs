using FlightPlanner.API.Middleware;
using FlightPlanner.Core.Configuration;
using FlightPlanner.Infrastructure.DependencyInjection;
using FlightPlanner.Infrastructure.Persistence;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load();

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var jwtKey = ConfigResolver.Resolve(builder.Configuration["Jwt:Key"])!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<FlightPlannerDbContext>();
        await FlightPlannerDbContext.SeedAirportsAsync(context);
        await FlightPlannerDbContext.SeedAirlinesAsync(context);
        await FlightPlannerDbContext.SeedFlightsAsync(context);
        await FlightPlannerDbContext.SeedSofiaExtendedFlightsAsync(context);
        await FlightPlannerDbContext.SeedMassEuropeanFlightsAsync(context);
        await FlightPlannerDbContext.SeedGlobalAirlinesAsync(context);
        await FlightPlannerDbContext.SeedGlobalFlightsAsync(context);
        logger.LogInformation("Seed process completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while seeding the database.");
    }
}

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors();
if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
