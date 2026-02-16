using System.Web.Mvc;

namespace DotNetFrameworkSamlSP.Controllers
{
    public class SessionCheckController : Controller
    {
        // GET: SessionCheck/Verify
        // Initiates a passive SAML authentication request
        // This is called by the extension in a hidden tab to verify IdP session
        public ActionResult Verify()
        {
            // Trigger SAML authentication with IsPassive=true
            // If the IdP session exists, user will be silently re-authenticated
            // If no IdP session, the IdP will return an error without user interaction
            var returnUrl = Server.UrlEncode(Url.Action("VerifyCallback", "SessionCheck"));
            return Redirect($"~/Saml2/SignIn?IsPassive=true&ReturnUrl={returnUrl}");
        }

        // GET: SessionCheck/VerifyCallback
        // Callback after passive authentication attempt
        public ActionResult VerifyCallback()
        {
            if (User.Identity.IsAuthenticated)
            {
                // IdP session is still active
                return RedirectToAction("Success");
            }
            else
            {
                // IdP session expired or IsPassive failed
                return RedirectToAction("Failure");
            }
        }

        // GET: SessionCheck/Success
        // IdP session is valid
        public ActionResult Success()
        {
            return Content("OK");
        }

        // GET: SessionCheck/Failure
        // IdP session is invalid or expired
        public ActionResult Failure()
        {
            return Content("EXPIRED");
        }
    }
}
