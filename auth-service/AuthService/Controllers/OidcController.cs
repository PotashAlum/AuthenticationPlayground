using System;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using Microsoft.Owin.Security;
using Microsoft.Owin.Security.OpenIdConnect;
using AuthService.Helpers;
using System.IO;
using Newtonsoft.Json;

namespace AuthService.Controllers
{
    public class OidcController : Controller
    {
        // GET: Oidc/Login
        public ActionResult Login(string returnType = null)
        {
            if (!string.IsNullOrEmpty(returnType))
            {
                // Store returnType in cookie for later retrieval
                Response.Cookies.Add(new HttpCookie("ReturnType", returnType)
                {
                    HttpOnly = true,
                    Secure = Request.IsSecureConnection
                });
            }

            // Trigger OIDC authentication
            HttpContext.GetOwinContext().Authentication.Challenge(
                new AuthenticationProperties { RedirectUri = "/Oidc/Callback" },
                OpenIdConnectAuthenticationDefaults.AuthenticationType
            );

            return new HttpUnauthorizedResult();
        }

        // GET: Oidc/Callback
        public ActionResult Callback()
        {
            var claimsPrincipal = User as ClaimsPrincipal;
            if (claimsPrincipal?.Identity?.IsAuthenticated == true)
            {
                var returnTypeCookie = Request.Cookies["ReturnType"];
                var returnType = returnTypeCookie?.Value;

                // Remove the cookie
                if (returnTypeCookie != null)
                {
                    returnTypeCookie.Expires = DateTime.Now.AddDays(-1);
                    Response.Cookies.Add(returnTypeCookie);
                }

                return HandleAuthenticatedUser(returnType);
            }

            return RedirectToAction("Index", "Home");
        }

        private ActionResult HandleAuthenticatedUser(string returnType)
        {
            // Extract user claims
            var claimsPrincipal = User as ClaimsPrincipal;
            var claims = claimsPrincipal?.Claims.ToList() ?? new System.Collections.Generic.List<Claim>();

            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                       ?? claims.FirstOrDefault(c => c.Type == "name")?.Value
                       ?? claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                       ?? "Unknown User";

            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                        ?? claims.FirstOrDefault(c => c.Type == "email")?.Value
                        ?? claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                        ?? "";

            // If returnType is "token", write session directly to file for desktop app
            if (returnType == "token")
            {
                WriteSessionToFile(name, email);
                ViewBag.UserName = name;
                ViewBag.UserEmail = email;
                ViewBag.AuthType = "OpenID Connect";
                return View("~/Views/Auth/LoginSuccess.cshtml");
            }

            // Otherwise, redirect to home
            return RedirectToAction("Index", "Home");
        }

        private void WriteSessionToFile(string name, string email)
        {
            try
            {
                var sessionFilePath = Path.Combine(Path.GetTempPath(), "auth-extension-session.json");
                var session = new
                {
                    user = new { name, email },
                    authenticatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
                    expiresAt = DateTimeOffset.Now.AddHours(24).ToUnixTimeMilliseconds()
                };
                var sessionJson = JsonConvert.SerializeObject(session);
                System.IO.File.WriteAllText(sessionFilePath, sessionJson);
            }
            catch (Exception ex)
            {
                // Log error but don't fail the request
                System.Diagnostics.Debug.WriteLine($"Failed to write session file: {ex.Message}");
            }
        }

        // GET: Oidc/Logout
        public ActionResult Logout()
        {
            // Sign out from OIDC
            HttpContext.GetOwinContext().Authentication.SignOut(
                OpenIdConnectAuthenticationDefaults.AuthenticationType,
                "OidcCookies"
            );

            return View("~/Views/Auth/LogoutSuccess.cshtml");
        }
    }
}
