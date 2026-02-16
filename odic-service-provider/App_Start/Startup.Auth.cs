using System.Configuration;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OpenIdConnect;
using Owin;

namespace OidcServiceProvider
{
    public partial class Startup
    {
        private static readonly string ClientId = ConfigurationManager.AppSettings["ida:ClientId"];
        private static readonly string ClientSecret = ConfigurationManager.AppSettings["ida:ClientSecret"];
        private static readonly string TenantId = ConfigurationManager.AppSettings["ida:TenantId"];
        private static readonly string Authority = $"https://login.microsoftonline.com/{TenantId}/v2.0";
        private static readonly string RedirectUri = ConfigurationManager.AppSettings["ida:RedirectUri"];
        private static readonly string PostLogoutRedirectUri = ConfigurationManager.AppSettings["ida:PostLogoutRedirectUri"];

        public void ConfigureAuth(IAppBuilder app)
        {
            app.SetDefaultSignInAsAuthenticationType(CookieAuthenticationDefaults.AuthenticationType);

            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                CookieHttpOnly = true,
                CookieSecure = CookieSecureOption.Always,
                ExpireTimeSpan = System.TimeSpan.FromHours(1),
                SlidingExpiration = true
            });

            app.UseOpenIdConnectAuthentication(new OpenIdConnectAuthenticationOptions
            {
                ClientId = ClientId,
                ClientSecret = ClientSecret,
                Authority = Authority,
                RedirectUri = RedirectUri,
                PostLogoutRedirectUri = PostLogoutRedirectUri,
                Scope = OpenIdConnectScope.OpenIdProfile + " email",
                ResponseType = OpenIdConnectResponseType.CodeIdToken,
                TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://login.microsoftonline.com/{TenantId}/v2.0",
                    NameClaimType = "name"
                },
                Notifications = new OpenIdConnectAuthenticationNotifications
                {
                    AuthenticationFailed = context =>
                    {
                        context.HandleResponse();
                        context.Response.Redirect("/Home/Error?message=" +
                            System.Uri.EscapeDataString("Authentication failed. Please try again."));
                        return Task.FromResult(0);
                    }
                }
            });
        }
    }
}
