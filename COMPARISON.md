# SAML Service Provider Implementations Comparison

This repository contains two complete SAML 2.0 Service Provider implementations that are **completely independent** and can run simultaneously.

## Overview

| Aspect | Node.js Version | .NET Framework Version |
|--------|----------------|------------------------|
| **Location** | `saml-service-provider/` | `dotnet-saml-service-provider/` |
| **Language** | JavaScript (Node.js) | C# (.NET Framework 4.8) |
| **Framework** | Express.js | ASP.NET MVC 5 |
| **Platform** | Cross-platform (Windows, macOS, Linux) | Windows only |
| **Runtime** | Node.js 18+ | .NET Framework 4.8 |
| **IDE** | VS Code, any text editor | Visual Studio 2019/2022 |
| **Port** | 3000 | 5000 |
| **Can run simultaneously?** | ✅ Yes | ✅ Yes |

## SAML Configuration

| Feature | Node.js | .NET Framework |
|---------|---------|----------------|
| **Entity ID** | `saml-service-provider` | `dotnet-framework-saml-sp` |
| **Metadata URL** | http://localhost:3000/metadata | http://localhost:5000/Saml2 |
| **Login Endpoint** | http://localhost:3000/login | http://localhost:5000/Auth/Login |
| **ACS (Callback)** | http://localhost:3000/login/callback | http://localhost:5000/Saml2/Acs |
| **Logout Endpoint** | http://localhost:3000/logout | http://localhost:5000/Auth/Logout |
| **SAML Library** | passport-saml | Sustainsys.Saml2 |

## Certificates

| Aspect | Node.js | .NET Framework |
|--------|---------|----------------|
| **Location** | `saml-service-provider/certs/` | `dotnet-saml-service-provider/DotNetFrameworkSamlSP/certs/` |
| **Primary Format** | PEM (.pem) | PFX (.pfx) |
| **For Azure Upload** | CER (.cer) | CER (.cer) |
| **Password Protected** | No | No (but can be) |
| **Separate Certs?** | ✅ Yes, completely separate | ✅ Yes, completely separate |

## Architecture

### Node.js Version

```
saml-service-provider/
├── src/
│   ├── server.js           # Express server & routes
│   ├── saml-config.js      # SAML strategy configuration
│   └── metadata-parser.js  # IdP metadata parser
├── certs/
│   ├── sp-cert.pem         # Public certificate
│   ├── sp-cert.cer         # For Azure
│   └── sp-key.pem          # Private key
└── .env                    # Configuration
```

**Key Features:**
- Lightweight and fast
- Simple configuration via .env file
- Easy to customize
- Great for prototyping and learning
- Cross-platform development

### .NET Framework Version

```
dotnet-saml-service-provider/
└── DotNetFrameworkSamlSP/
    ├── Web.config          # SAML configuration
    ├── Controllers/        # MVC controllers
    ├── Views/              # Razor views
    ├── App_Start/          # Application startup
    ├── certs/              # SP certificates
    │   ├── sp-cert.pfx     # For .NET
    │   └── sp-cert.cer     # For Azure
    └── Properties/         # Assembly info
```

**Key Features:**
- Enterprise-grade
- Strong typing with C#
- Integrated with ASP.NET Identity
- Native Windows integration
- Visual Studio tooling
- Production-ready

## Setup & Installation

### Node.js Version

```bash
cd saml-service-provider
npm install
npm run generate-cert  # Generate certificates
npm start              # Start on port 3000
```

**Prerequisites:**
- Node.js 18+
- npm

**Time to setup:** ~2 minutes

### .NET Framework Version

1. Open `DotNetFrameworkSamlSP.sln` in Visual Studio
2. Restore NuGet packages (automatic)
3. Press F5 to run

**Prerequisites:**
- Visual Studio 2019/2022
- .NET Framework 4.8 (pre-installed on Windows 10/11)

**Time to setup:** ~3 minutes

## Configuration

### Node.js - .env File

```env
SAML_METADATA_URL=https://login.microsoftonline.com/.../federationmetadata.xml
SAML_CALLBACK_URL=http://localhost:3000/login/callback
SAML_ISSUER=saml-service-provider
PORT=3000
```

### .NET Framework - Web.config

```xml
<sustainsys.saml2 entityId="dotnet-framework-saml-sp" returnUrl="http://localhost:5000/">
  <identityProviders>
    <add entityId="..." metadataLocation="..." />
  </identityProviders>
</sustainsys.saml2>
```

## When to Use Which?

### Use Node.js Version When:

- ✅ Learning SAML basics
- ✅ Quick prototyping
- ✅ Cross-platform development
- ✅ Integrating with existing Node.js apps
- ✅ Microservices architecture
- ✅ Cloud-native applications (Docker, Kubernetes)
- ✅ You prefer JavaScript/TypeScript

### Use .NET Framework Version When:

- ✅ Building Windows enterprise applications
- ✅ Integrating with existing .NET Framework apps
- ✅ Need Visual Studio debugging tools
- ✅ Require strong typing and compile-time checks
- ✅ Working in a Microsoft-centric environment
- ✅ Need integration with Active Directory
- ✅ You prefer C# and object-oriented programming

## Running Both Simultaneously

Yes! Both can run at the same time since they:
- Use different ports (3000 vs 5000)
- Have different entity IDs
- Use separate certificate directories
- Are completely independent

**To run both:**

Terminal 1 (Node.js):
```bash
cd saml-service-provider
npm start
```

Terminal 2 (.NET Framework):
- Open Visual Studio
- Open `DotNetFrameworkSamlSP.sln`
- Press F5

Now you have:
- Node.js SP running on http://localhost:3000
- .NET Framework SP running on http://localhost:5000

## Azure AD Configuration

You'll need to create **two separate** Enterprise Applications in Azure AD:

### For Node.js SP:
- Entity ID: `saml-service-provider`
- Reply URL: `http://localhost:3000/login/callback`
- Certificate: `saml-service-provider/certs/sp-cert.cer`

### For .NET Framework SP:
- Entity ID: `dotnet-framework-saml-sp`
- Reply URL: `http://localhost:5000/Saml2/Acs`
- Certificate: `dotnet-saml-service-provider/DotNetFrameworkSamlSP/certs/sp-cert.cer`

## Testing Strategy

1. **Start with Node.js** version for quick learning and experimentation
2. **Move to .NET Framework** when ready for production Windows deployment
3. **Run both** to compare behavior and test different scenarios
4. **Use Node.js** for API/backend services
5. **Use .NET Framework** for traditional Windows web applications

## Migration Path

### From Node.js to .NET Framework

1. Copy your Azure AD configuration (Tenant ID, App ID)
2. Update `Web.config` with the values from `.env`
3. Certificates are separate, generate new ones or convert PEM to PFX
4. Test authentication flow in .NET version
5. Deploy .NET version to Windows Server/IIS

### From .NET Framework to Node.js

1. Extract SAML config from `Web.config`
2. Create `.env` file with equivalent values
3. Convert PFX to PEM if needed
4. Test in Node.js version
5. Deploy to your cloud platform (AWS, Azure, GCP)

## Performance Comparison

| Metric | Node.js | .NET Framework |
|--------|---------|----------------|
| **Startup Time** | ~1 second | ~3-5 seconds |
| **Memory Usage** | ~50-100 MB | ~100-200 MB |
| **Request Latency** | Very low | Very low |
| **Scalability** | Excellent (async I/O) | Excellent (IIS threading) |

## Security

Both implementations:
- ✅ Support certificate-based signing
- ✅ Validate SAML assertions
- ✅ Verify IdP signatures
- ✅ Support encrypted assertions
- ✅ Implement secure session management
- ✅ Follow SAML 2.0 best practices

## Support & Community

| Aspect | Node.js (passport-saml) | .NET Framework (Sustainsys.Saml2) |
|--------|-------------------------|-----------------------------------|
| **GitHub Stars** | ~600 | ~900 |
| **Active Development** | ✅ Yes | ✅ Yes |
| **Documentation** | Good | Excellent |
| **Community** | Large | Large |
| **Stack Overflow** | Many questions | Many questions |

## Conclusion

Both implementations are **production-ready** and suitable for different scenarios:

- Choose **Node.js** for modern, cross-platform, cloud-native applications
- Choose **.NET Framework** for Windows enterprise applications with Visual Studio

You can't go wrong with either choice - pick the one that best fits your stack and requirements!

---

**Need help?** Check the README files in each project folder:
- [Node.js README](saml-service-provider/README.md)
- [.NET Framework README](dotnet-saml-service-provider/README.md)
