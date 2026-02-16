# .NET Framework SAML Service Provider

A complete SAML 2.0 Service Provider implementation using **ASP.NET MVC 5** and **.NET Framework 4.8** with **Sustainsys.Saml2**.

> ⚠️ **IMPORTANT**: This project requires **Visual Studio 2019/2022** to build and run. The `dotnet` CLI has limited support for .NET Framework projects. See [IMPORTANT.md](IMPORTANT.md) for details.

## Quick Start

1. **Install Visual Studio 2019/2022** (free Community Edition)
2. **Open `DotNetFrameworkSamlSP.sln`**
3. **Press F5** to run
4. **Navigate to** http://localhost:5000

## Features

- ✅ SAML 2.0 authentication with Azure Entra ID (Azure AD)
- ✅ Automatic IdP metadata loading
- ✅ SP certificate support for signing and encryption
- ✅ User claims display after authentication
- ✅ Single Sign-On (SSO) and Single Logout (SLO)
- ✅ Metadata endpoint for IdP configuration
- ✅ ASP.NET MVC 5 with Razor views
- ✅ .NET Framework 4.8

## Prerequisites

- **Visual Studio 2019/2022** or **Visual Studio Code** with C# extension
- **.NET Framework 4.8** (should be pre-installed on Windows 10/11)
- **IIS Express** (comes with Visual Studio)
- Azure Entra ID tenant with SAML application configured

## Project Structure

```
dotnet-saml-service-provider/
└── DotNetFrameworkSamlSP/
    ├── DotNetFrameworkSamlSP.csproj  # Project file
    ├── Web.config                     # SAML configuration
    ├── Global.asax                    # Application startup
    ├── packages.config                # NuGet packages
    ├── App_Start/
    │   └── RouteConfig.cs            # MVC routing
    ├── Controllers/
    │   ├── HomeController.cs         # Home page
    │   └── AuthController.cs         # Authentication logic
    ├── Views/
    │   ├── Home/
    │   │   └── Index.cshtml          # Main page with auth status
    │   ├── Shared/
    │   │   └── _Layout.cshtml        # Layout template
    │   ├── _ViewStart.cshtml
    │   └── Web.config
    ├── Properties/
    │   └── AssemblyInfo.cs
    └── certs/
        ├── sp-cert.pem               # SP public certificate (PEM)
        ├── sp-cert.cer               # SP public certificate (CER for Azure)
        ├── sp-cert.pfx               # SP certificate with private key (PFX)
        └── sp-key.pem                # SP private key (PEM)
```

## Installation & Setup

### 1. Open Project in Visual Studio

1. Open Visual Studio 2019 or 2022
2. File → Open → Project/Solution
3. Navigate to `dotnet-saml-service-provider/DotNetFrameworkSamlSP`
4. Open `DotNetFrameworkSamlSP.csproj`

### 2. Restore NuGet Packages

Visual Studio should automatically restore NuGet packages. If not:
- Right-click on the solution → **Restore NuGet Packages**

Required packages:
- `Microsoft.AspNet.Mvc` (5.2.9)
- `Sustainsys.Saml2` (2.11.0)
- `Sustainsys.Saml2.Mvc` (2.11.0)
- `Sustainsys.Saml2.HttpModule` (2.11.0)

### 3. Configure Azure Entra ID Settings

Edit `Web.config` and update the IdP configuration with your Azure tenant details:

```xml
<sustainsys.saml2 entityId="dotnet-framework-saml-sp" returnUrl="http://localhost:5000/">
  <identityProviders>
    <add entityId="https://sts.windows.net/YOUR-TENANT-ID/"
         metadataLocation="https://login.microsoftonline.com/YOUR-TENANT-ID/federationmetadata/2007-06/federationmetadata.xml?appid=YOUR-APP-ID"
         allowUnsolicitedAuthnResponse="true" />
  </identityProviders>
</sustainsys.saml2>
```

### 4. Configure IIS Express Port

Edit `.vs\DotNetFrameworkSamlSP\config\applicationhost.config` or use Visual Studio project properties to set the port to **5000**.

Or create a `Properties\launchSettings.json` file if using VS Code.

## Running the Application

### Option A: Visual Studio

1. Press **F5** or click **Start Debugging**
2. The application will launch in your default browser
3. Navigate to `http://localhost:5000`

### Option B: IIS Express (Command Line)

```cmd
cd dotnet-saml-service-provider\DotNetFrameworkSamlSP
"C:\Program Files\IIS Express\iisexpress.exe" /path:%CD% /port:5000
```

## SAML Endpoints

Once running, the following endpoints are available:

- **Home Page**: http://localhost:5000
- **Metadata**: http://localhost:5000/Saml2
- **Login**: http://localhost:5000/Auth/Login
- **ACS (Callback)**: http://localhost:5000/Saml2/Acs
- **Logout**: http://localhost:5000/Auth/Logout

## Configure Azure Entra ID

1. Go to **Azure Portal** → **Entra ID** → **Enterprise Applications**
2. Create or select your SAML application
3. Navigate to **Single sign-on** (SAML)
4. Configure the following:
   - **Identifier (Entity ID)**: `dotnet-framework-saml-sp`
   - **Reply URL (ACS)**: `http://localhost:5000/Saml2/Acs`
   - **Sign on URL**: `http://localhost:5000/Auth/Login`
   - **Logout URL**: `http://localhost:5000/Auth/Logout`
5. **(Optional)** Upload SP certificate for token encryption: `certs/sp-cert.cer`

## Testing Authentication

1. Navigate to http://localhost:5000
2. Click **"Login with SAML"**
3. You'll be redirected to Azure AD login page
4. Enter your credentials
5. After successful authentication, you'll be redirected back to the app
6. View your user claims on the home page

## Certificates

The project includes pre-generated self-signed certificates in the `certs/` folder:

- **sp-cert.pfx**: Used by .NET for signing SAML requests (no password)
- **sp-cert.cer**: Upload this to Azure Entra ID for token encryption
- **sp-cert.pem**: Public certificate in PEM format
- **sp-key.pem**: Private key in PEM format

### Using Certificates (Optional)

To enable request signing and assertion encryption, uncomment this line in `Web.config`:

```xml
<serviceCertificates>
  <add fileName="~/certs/sp-cert.pfx" use="Both" />
</serviceCertificates>
```

### Regenerate Certificates

```bash
cd DotNetFrameworkSamlSP/certs

# Generate PEM certificates
openssl req -x509 -newkey rsa:2048 -keyout sp-key.pem -out sp-cert.pem -days 365 -nodes -subj "//C=US\ST=State\L=City\O=Organization\CN=DotNetFrameworkSamlSP"

# Convert to PFX (for .NET)
openssl pkcs12 -export -out sp-cert.pfx -inkey sp-key.pem -in sp-cert.pem -passout pass:

# Convert to CER (for Azure)
openssl x509 -in sp-cert.pem -outform der -out sp-cert.cer
```

## Comparison: .NET Framework vs Node.js

| Feature | Node.js Version | .NET Framework Version |
|---------|----------------|------------------------|
| **Platform** | Cross-platform | Windows only |
| **Framework** | Express.js | ASP.NET MVC 5 |
| **Runtime** | Node.js | .NET Framework 4.8 |
| **Port** | 3000 | 5000 |
| **Entity ID** | `saml-service-provider` | `dotnet-framework-saml-sp` |
| **Metadata Path** | `/metadata` | `/Saml2` |
| **Login Path** | `/login` | `/Auth/Login` |
| **ACS Path** | `/login/callback` | `/Saml2/Acs` |
| **Library** | passport-saml | Sustainsys.Saml2 |
| **Certificate Format** | PEM | PFX |
| **IDE** | VS Code | Visual Studio |

## Architecture

### How It Works

1. **User visits** the application (not authenticated)
2. **User clicks "Login"** → redirects to `/Auth/Login`
3. **Sustainsys.Saml2 generates** a SAML AuthnRequest
4. **User is redirected** to Azure AD login page
5. **User authenticates** with Azure AD
6. **Azure AD sends** SAML Response to ACS endpoint (`/Saml2/Acs`)
7. **Sustainsys.Saml2 validates** the SAML Response and creates authentication cookie
8. **User is redirected** back to the home page (authenticated)
9. **User claims are displayed** from the SAML assertion

### Configuration in Web.config

The `<sustainsys.saml2>` section in `Web.config` configures:
- **SP Entity ID**: Unique identifier for this Service Provider
- **Return URL**: Where to redirect after successful authentication
- **IdP settings**: Metadata URL, entity ID, binding type
- **Certificates**: Optional SP certificate for signing/encryption

### HttpModule

The `Sustainsys.Saml2.HttpModule` handles SAML protocol messages automatically:
- Generates SAML AuthnRequest
- Validates SAML Response
- Processes ACS callback
- Handles logout

## Troubleshooting

### NuGet Package Restore Failed

Run in Package Manager Console:
```powershell
Update-Package -reinstall
```

### Port Already in Use

Change the port in project properties or `applicationhost.config`.

### Certificate Not Loading

Ensure the `sp-cert.pfx` file exists in the `certs/` folder and the path in `Web.config` is correct:
```xml
<add fileName="~/certs/sp-cert.pfx" use="Both" />
```

### Azure AD Doesn't Work with localhost

Azure Entra ID may not work with `localhost`. Alternatives:
1. Use `http://127.0.0.1:5000`
2. Use a tunneling service (ngrok)
3. Add a hosts file entry

## Standalone from Node.js Version

This .NET Framework version is **completely independent** from the Node.js version:
- ✅ Different port (5000 vs 3000)
- ✅ Different entity ID
- ✅ Separate certificate directory
- ✅ Can run simultaneously with Node.js version

## Resources

- [Sustainsys.Saml2 Documentation](https://github.com/Sustainsys/Saml2)
- [ASP.NET MVC Documentation](https://docs.microsoft.com/en-us/aspnet/mvc/)
- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [Azure AD SAML Protocol](https://learn.microsoft.com/en-us/azure/active-directory/develop/single-sign-on-saml-protocol)

## License

MIT
