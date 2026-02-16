using System.Configuration;

namespace AuthService.Helpers
{
    public static class ConfigHelper
    {
        public static string AzureTenantId => ConfigurationManager.AppSettings["AzureTenantId"] ?? "YOUR_TENANT_ID";
        public static string ExtensionId => ConfigurationManager.AppSettings["ExtensionId"] ?? "YOUR_EXTENSION_ID";
        public static string SamlEntityId => ConfigurationManager.AppSettings["SamlEntityId"] ?? "https://localhost:44300/";
        public static string AuthAppUrl => ConfigurationManager.AppSettings["AuthAppUrl"] ?? "https://localhost:44300";
    }
}
