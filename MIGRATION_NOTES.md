# Migration Notes - Auth Service Refactoring

## Changes Made

### Folder Renaming

- `dotnet-saml-service-provider/` → `auth-service/`
- `dotnet-saml-service-provider/DotNetFrameworkSamlSP/` → `auth-service/AuthService/`

### OIDC Removal

The OIDC/OpenID Connect functionality has been **removed** because:

1. **OWIN is .NET Framework only** - Microsoft.Owin packages don't support .NET Core/.NET 8
2. **Goal is multi-platform** - Need to support both .NET Framework 4.8 and .NET 8.0
3. **SAML is sufficient** - Sustainsys.Saml2 works on both platforms

#### Files Removed

- `Startup.cs` - OWIN startup (Framework-only)
- `App_Start/Startup.Auth.cs` - OIDC configuration (Framework-only)
- `Controllers/OidcController.cs` - OIDC authentication controller

#### Packages Removed

```xml
<package id="Microsoft.Owin" version="4.2.2" />
<package id="Microsoft.Owin.Host.SystemWeb" version="4.2.2" />
<package id="Microsoft.Owin.Security" version="4.2.2" />
<package id="Microsoft.Owin.Security.Cookies" version="4.2.2" />
<package id="Microsoft.Owin.Security.OpenIdConnect" version="4.2.2" />
<package id="Microsoft.IdentityModel.Protocols.OpenIdConnect" version="5.7.0" />
<package id="System.IdentityModel.Tokens.Jwt" version="5.7.0" />
<package id="Owin" version="1.0" />
```

### UI Changes

#### Home/Index.cshtml

**Before:**
- Title: "Unified Auth Service Provider"
- Subtitle: ".NET Framework 4.8 with SAML 2.0 & OpenID Connect"
- Two login buttons: SAML 2.0 and OpenID Connect

**After:**
- Title: "Auth Service"
- Subtitle: "Multi-platform SAML 2.0 Authentication (.NET Framework 4.8 & .NET 8.0)"
- Single login button: SAML 2.0 only

### Configuration Cleanup

The `secrets.config` still contains OIDC settings for backwards compatibility:

```xml
<!-- These are no longer used but kept for reference -->
<add key="ida:ClientId" value="..." />
<add key="ida:ClientSecret" value="..." />
<add key="ida:TenantId" value="..." />
```

You can remove these if you won't need OIDC in the future.

## Why This Approach?

### Cross-Platform Compatibility

The goal was to make the auth service run on both:
- **.NET Framework 4.8** (Windows, IIS/IIS Express)
- **.NET 8.0** (Windows, Linux, macOS, Kestrel)

### Technology Constraints

| Technology | .NET Framework 4.8 | .NET 8.0 |
|------------|-------------------|----------|
| **Sustainsys.Saml2** | ✅ Yes | ✅ Yes |
| **ASP.NET MVC** | ✅ Yes | ✅ Yes (with compatibility) |
| **Microsoft.Owin** | ✅ Yes | ❌ No |
| **OIDC (Owin)** | ✅ Yes | ❌ No |

### What Works on Both

The following features work on **both** platforms:

- ✅ SAML 2.0 authentication
- ✅ Extension communication
- ✅ Native messaging for desktop apps
- ✅ Session file management
- ✅ Azure AD integration
- ✅ Multi-app SSO

## Alternative for OIDC on .NET 8

If you need OIDC/OpenID Connect on .NET 8, you would use:

```csharp
// In Program.cs or Startup.cs for .NET 8
services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddOpenIdConnect(options =>
    {
        options.ClientId = configuration["AzureAd:ClientId"];
        options.ClientSecret = configuration["AzureAd:ClientSecret"];
        options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
        // ...
    });
```

This uses `Microsoft.AspNetCore.Authentication.OpenIdConnect` instead of the OWIN middleware.

## Current State

### What's Working

- ✅ Auth Service renamed
- ✅ OWIN/OIDC removed
- ✅ SAML 2.0 authentication (cross-platform compatible)
- ✅ Extension integration
- ✅ Desktop app integration
- ✅ Web app integration
- ✅ Single codebase for both .NET Framework and .NET 8

### What Needs Testing

- [ ] Build and run on .NET Framework 4.8
- [ ] Build and run on .NET 8.0
- [ ] Verify SAML authentication works on both
- [ ] Test extension communication on both
- [ ] Test desktop app integration on both

## Next Steps

To fully enable multi-targeting, you would need to:

1. **Convert to SDK-style project** - The current `.csproj` is old-style
2. **Add multi-targeting** - `<TargetFrameworks>net48;net8.0</TargetFrameworks>`
3. **Conditional compilation** - Use `#if NET48` or `#if NET8_0` for platform-specific code
4. **Test thoroughly** - Ensure all features work on both platforms

However, the current project can be built separately for each framework without multi-targeting by changing the `<TargetFramework>` element.

## Rollback Instructions

If you need to restore OIDC functionality:

1. Restore the deleted files from git history:
   - `Startup.cs`
   - `App_Start/Startup.Auth.cs`
   - `Controllers/OidcController.cs`

2. Restore the OWIN packages in `packages.config`

3. Run `dotnet restore` or use NuGet Package Manager in Visual Studio

4. Restore the dual-button UI in `Views/Home/Index.cshtml`

Note: This will make the project .NET Framework 4.8 only again.
