using System;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;

namespace DotNetFrameworkSamlSP
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
    }
}
