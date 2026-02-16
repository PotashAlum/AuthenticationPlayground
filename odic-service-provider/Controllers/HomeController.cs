using System.Security.Claims;
using System.Web.Mvc;

namespace OidcServiceProvider.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        [Authorize]
        public ActionResult Claims()
        {
            var identity = User.Identity as ClaimsIdentity;
            return View(identity.Claims);
        }

        public ActionResult Error(string message)
        {
            ViewBag.ErrorMessage = message;
            return View("Index");
        }
    }
}
