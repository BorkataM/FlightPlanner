using FlightPlanner.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Mail;

namespace FlightPlanner.Infrastructure.Services
{
    // SMTP sender configured via EMAIL_* env vars; logs to console when unconfigured.
    public class SmtpEmailSender : IEmailSender
    {
        private readonly ILogger<SmtpEmailSender> _logger;

        private readonly string? _host;
        private readonly int _port;
        private readonly string? _user;
        private readonly string? _password;
        private readonly string _from;

        public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
        {
            _logger = logger;

            _host     = Env("EMAIL_HOST", configuration["Email:Host"]);
            _user     = Env("EMAIL_USER", configuration["Email:User"]);
            _password = Env("EMAIL_PASSWORD", configuration["Email:Password"]);
            _from     = Env("EMAIL_FROM", configuration["Email:From"]) ?? _user ?? "no-reply@skywave.app";

            var rawPort = Env("EMAIL_PORT", configuration["Email:Port"]);
            _port = int.TryParse(rawPort, out var p) ? p : 587;
        }

        private bool IsConfigured =>
            !string.IsNullOrWhiteSpace(_host) &&
            !string.IsNullOrWhiteSpace(_user) &&
            !string.IsNullOrWhiteSpace(_password);

        public async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            if (!IsConfigured)
            {
                _logger.LogWarning(
                    "SMTP not configured (set EMAIL_HOST/EMAIL_PORT/EMAIL_USER/EMAIL_PASSWORD/EMAIL_FROM). " +
                    "Email to {To} was NOT sent. Subject: {Subject}\n{Body}",
                    toEmail, subject, htmlBody);
                return;
            }

            using var message = new MailMessage
            {
                From       = new MailAddress(_from!, "SkyWave"),
                Subject    = subject,
                Body       = htmlBody,
                IsBodyHtml = true,
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(_host, _port)
            {
                EnableSsl   = true,
                Credentials = new NetworkCredential(_user, _password),
            };

            await client.SendMailAsync(message);
            _logger.LogInformation("Password-reset email sent to {To}", toEmail);
        }

        private static string? Env(string key, string? fallback)
        {
            var value = Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(value)) return value;
            // appsettings may contain a "${EMAIL_...}" placeholder that wasn't substituted — treat as unset
            if (fallback is not null && fallback.StartsWith("${")) return null;
            return fallback;
        }
    }
}
