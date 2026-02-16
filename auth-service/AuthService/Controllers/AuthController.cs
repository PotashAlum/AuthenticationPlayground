using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Web;
using System.Web.Mvc;
using System.Web.Security;
using Newtonsoft.Json;

namespace AuthService.Controllers
{
    public class AuthController : Controller
    {
        // GET: Auth/Login
        // This redirects to the SAML2 module which handles the actual SAML authentication
        public ActionResult Login(string returnType = null)
        {
            // Check if already authenticated
            if (User.Identity.IsAuthenticated)
            {
                return HandleAuthenticatedUser(returnType);
            }

            // Store returnType in session so we can use it after SAML login
            if (!string.IsNullOrEmpty(returnType))
            {
                Session["ReturnType"] = returnType;
            }

            // The Sustainsys.Saml2.HttpModule handles /Saml2/SignIn automatically
            // Just redirect there with callback to process the returnType
            var returnUrl = string.IsNullOrEmpty(returnType)
                ? Url.Action("Index", "Home")
                : Url.Action("Callback", "Auth");

            return Redirect("~/Saml2/SignIn?ReturnUrl=" + Server.UrlEncode(returnUrl));
        }

        // GET: Auth/Callback
        // This is called after successful SAML authentication
        public ActionResult Callback()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return RedirectToAction("Login");
            }

            string returnType = Session["ReturnType"] as string;
            Session.Remove("ReturnType");

            return HandleAuthenticatedUser(returnType);
        }

        private ActionResult HandleAuthenticatedUser(string returnType)
        {
            // Extract user claims
            var claimsPrincipal = User as ClaimsPrincipal;
            var claims = claimsPrincipal?.Claims.ToList() ?? new System.Collections.Generic.List<Claim>();

            var name = claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value
                       ?? claims.FirstOrDefault(c => c.Type == "name")?.Value
                       ?? "Unknown User";

            var email = claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                        ?? claims.FirstOrDefault(c => c.Type == "email")?.Value
                        ?? claims.FirstOrDefault(c => c.Type == ClaimTypes.Upn)?.Value
                        ?? "";

            // If returnType is "token", write session directly to file for desktop app
            if (returnType == "token")
            {
                WriteSessionToFile(name, email);
                ViewBag.UserName = name;
                ViewBag.UserEmail = email;
                ViewBag.AuthType = "SAML 2.0";
                return View("LoginSuccess");
            }

            // Otherwise, just show the regular callback page that saves to extension
            ViewBag.UserName = name;
            ViewBag.UserEmail = email;
            ViewBag.AuthType = "SAML 2.0";
            return View("LoginSuccess");
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

        // POST/GET: Auth/ExtensionLogin
        // This endpoint accepts a session from the extension and creates an authenticated session
        public ActionResult ExtensionLogin(string userName, string userEmail)
        {
            if (string.IsNullOrEmpty(userName))
            {
                return Json(new { success = false, error = "Missing userName" }, JsonRequestBehavior.AllowGet);
            }

            try
            {
                // Sign in the user using Forms Authentication
                var ticket = new FormsAuthenticationTicket(
                    version: 1,
                    name: userName,
                    issueDate: DateTime.Now,
                    expiration: DateTime.Now.AddHours(24),
                    isPersistent: true, // Make it persistent
                    userData: JsonConvert.SerializeObject(new { email = userEmail, authType = "Extension" })
                );

                var encryptedTicket = FormsAuthentication.Encrypt(ticket);
                var cookie = new HttpCookie(FormsAuthentication.FormsCookieName, encryptedTicket)
                {
                    HttpOnly = true,
                    Secure = Request.IsSecureConnection,
                    Path = FormsAuthentication.FormsCookiePath,
                    Expires = DateTime.Now.AddHours(24)
                };

                Response.Cookies.Add(cookie);

                System.Diagnostics.Debug.WriteLine($"ExtensionLogin: Created cookie for {userName}");
                System.Diagnostics.Debug.WriteLine($"Cookie name: {FormsAuthentication.FormsCookieName}");
                System.Diagnostics.Debug.WriteLine($"Cookie path: {FormsAuthentication.FormsCookiePath}");

                return Json(new { success = true, cookieName = FormsAuthentication.FormsCookieName }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"ExtensionLogin error: {ex.Message}");
                return Json(new { success = false, error = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

        // GET: Auth/CheckAuth
        // Debug endpoint to check authentication status
        public ActionResult CheckAuth()
        {
            var isAuthenticated = Request.IsAuthenticated;
            var userName = User.Identity.IsAuthenticated ? User.Identity.Name : "Not authenticated";
            var authType = User.Identity.AuthenticationType ?? "None";

            var cookieExists = Request.Cookies[FormsAuthentication.FormsCookieName] != null;

            return Json(new
            {
                isAuthenticated,
                userName,
                authType,
                cookieExists,
                cookieName = FormsAuthentication.FormsCookieName
            }, JsonRequestBehavior.AllowGet);
        }

        // GET: Auth/Logout
        public ActionResult Logout()
        {
            // Clear forms authentication cookie
            FormsAuthentication.SignOut();
            Session.Abandon();

            // Show logout success page which clears extension session
            return View("LogoutSuccess");
        }
    }
}
