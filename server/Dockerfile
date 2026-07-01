# FlightPlanner .NET API - build context must be the server/ directory
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Restore first (cached) - copy only the project files
COPY FlightPlanner.API/FlightPlanner.API/FlightPlanner.API.csproj FlightPlanner.API/FlightPlanner.API/
COPY FlightPlanner.Core/FlightPlanner.Core.csproj FlightPlanner.Core/
COPY FlightPlanner.Infrastructure/FlightPlanner.Infrastructure.csproj FlightPlanner.Infrastructure/
RUN dotnet restore FlightPlanner.API/FlightPlanner.API/FlightPlanner.API.csproj

# Copy the rest and publish
COPY . .
RUN dotnet publish FlightPlanner.API/FlightPlanner.API/FlightPlanner.API.csproj \
    -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Kestrel listens on 8080 (no HTTPS inside the container - TLS terminates upstream)
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

ENTRYPOINT ["dotnet", "FlightPlanner.API.dll"]
