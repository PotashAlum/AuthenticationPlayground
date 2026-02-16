using System;
using System.Configuration;
using System.Threading.Tasks;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.Cookies;
using Microsoft.Owin.Security.OpenIdConnect;
using Owin;

namespace AuthService
{
    public partial class Startup
    {
        public void ConfigureAuth(IAppBuilder app)
        {
            // Set the default authentication type
            app.SetDefaultSignInAsAuthenticationType("OidcCookies");

            // Configure cookie authentication for OIDC
            app.UseCookieAuthentication(new CookieAuthenticationOptions
            {
                AuthenticationType = "OidcCookies",
                CookieName = ".AspNet.OidcCookies",
                ExpireTimeSpan = TimeSpan.FromHours(24),
                SlidingExpiration = true
            });

            // Configure OpenID Connect authentication
            var clientId = ConfigurationManager.AppSettings["ida:ClientId"];
            var clientSecret = ConfigurationManager.AppSettings["ida:ClientSecret"];
            var tenantId = ConfigurationManager.AppSettings["ida:TenantId"];
            var redirectUri = ConfigurationManager.AppSettings["ida:RedirectUri"];

            app.UseOpenIdConnectAuthentication(new OpenIdConnectAuthenticationOptions
            {
                ClientId = clientId,
                ClientSecret = clientSecret,
                Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0",
                RedirectUri = redirectUri,
                PostLogoutRedirectUri = redirectUri,
                Scope = "openid profile email",
                ResponseType = "code id_token",

                // Use the cookie authentication type
                SignInAsAuthenticationType = "OidcCookies",

                // Configure token validation
                TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://login.microsoftonline.com/{tenantId}/v2.0",
                    ValidateAudience = true,
                    ValidAudience = clientId,
                    ValidateLifetime = true
                },

                Notifications = new OpenIdConnectAuthenticationNotifications
                {
                    AuthenticationFailed = context =>
                    {
                        context.HandleResponse();
                        context.Response.Redirect("/Home/Error?message=" + context.Exception.Message);
                        return Task.FromResult(0);
                    },
                    RedirectToIdentityProvider = context =>
                    {
                        // Add returnType parameter if present in the original request
                        var returnType = context.OwinContext.Request.Query["returnType"];
                        if (!string.IsNullOrEmpty(returnType))
                        {
                            context.OwinContext.Response.Cookies.Append("ReturnType", returnType);
                        }
                        return Task.FromResult(0);
                    }
                }
            });
        }
    }
}
