using Microsoft.Owin;
using Owin;

[assembly: OwinStartup(typeof(OidcServiceProvider.Startup))]

namespace OidcServiceProvider
{
    public partial class Startup
    {
        public void Configuration(IAppBuilder app)
        {
            ConfigureAuth(app);
        }
    }
}
