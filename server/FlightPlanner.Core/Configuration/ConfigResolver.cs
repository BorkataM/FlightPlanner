using System.Text.RegularExpressions;

namespace FlightPlanner.Core.Configuration
{
    /// <summary>
    /// Resolves <c>${VAR}</c> placeholders in configuration values against environment
    /// variables. If a variable is not set, the placeholder is left untouched so the
    /// failure surfaces clearly rather than producing a silently empty value.
    /// </summary>
    public static partial class ConfigResolver
    {
        public static string? Resolve(string? raw)
        {
            if (string.IsNullOrEmpty(raw)) return raw;
            return PlaceholderRegex().Replace(raw, match =>
                Environment.GetEnvironmentVariable(match.Groups[1].Value) ?? match.Value);
        }

        [GeneratedRegex(@"\$\{([A-Z0-9_]+)\}")]
        private static partial Regex PlaceholderRegex();
    }
}
