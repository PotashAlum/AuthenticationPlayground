using System.Web.Mvc;

namespace AuthService.Controllers
{
    public class HomeController : Controller
    {
        // GET: Home
        public ActionResult Index()
        {
            // Show the view which will:
            // 1. Check extension for existing session and redirect to web app if found
            // 2. If authenticated server-side, redirect to web app
            // 3. Otherwise show login options
            return View();
        }
    }
}
