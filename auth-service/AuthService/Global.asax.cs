using System;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using System.Web.Security;
using Newtonsoft.Json;

namespace AuthService
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            RouteConfig.RegisterRoutes(RouteTable.Routes);

            Console.WriteLine("===========================================");
            Console.WriteLine("SAML Service Provider (.NET Framework)");
            Console.WriteLine("===========================================");
            Console.WriteLine("Service running on: https://localhost:44300");
            Console.WriteLine("Metadata: https://localhost:44300/Saml2");
            Console.WriteLine("Login: https://localhost:44300/Auth/Login");
            Console.WriteLine("ACS (Callback): https://localhost:44300/Saml2/Acs");
            Console.WriteLine("===========================================");
        }

        protected void Application_AuthenticateRequest(Object sender, EventArgs e)
        {
            // Check for Forms Authentication cookie
            var authCookie = Request.Cookies[FormsAuthentication.FormsCookieName];
            if (authCookie != null)
            {
                try
                {
                    var ticket = FormsAuthentication.Decrypt(authCookie.Value);
                    if (ticket != null && !ticket.Expired)
                    {
                        // Parse user data to get claims
                        var claims = new System.Collections.Generic.List<Claim>
                        {
                            new Claim(ClaimTypes.Name, ticket.Name)
                        };

                        if (!string.IsNullOrEmpty(ticket.UserData))
                        {
                            try
                            {
                                var userData = JsonConvert.DeserializeObject<dynamic>(ticket.UserData);
                                if (userData.email != null)
                                {
                                    claims.Add(new Claim(ClaimTypes.Email, userData.email.ToString()));
                                }
                                if (userData.authType != null)
                                {
                                    claims.Add(new Claim("AuthType", userData.authType.ToString()));
                                }
                            }
                            catch
                            {
                                // Ignore JSON parsing errors
                            }
                        }

                        var identity = new ClaimsIdentity(claims, "Forms");
                        var principal = new ClaimsPrincipal(identity);
                        Context.User = principal;

                        // Also set Thread.CurrentPrincipal for backwards compatibility
                        System.Threading.Thread.CurrentPrincipal = principal;
                    }
                }
                catch
                {
                    // Ignore decryption errors
                }
            }
        }
    }
}
