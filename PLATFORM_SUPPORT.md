# Platform Support Guide

## Overview

The Auth Service supports both .NET Framework 4.8 and .NET 8.0, but with different feature sets.

## Feature Matrix

| Feature | .NET Framework 4.8 | .NET 8.0 | Notes |
|---------|-------------------|----------|-------|
| **SAML 2.0** | ✅ Full Support | ✅ Full Support | Sustainsys.Saml2 works on both |
| **OpenID Connect** | ✅ Full Support | ❌ Not Available | OWIN is Framework-only |
| **Extension Integration** | ✅ Works | ✅ Works | JavaScript-based, platform-agnostic |
| **Desktop App Integration** | ✅ Works | ✅ Works | Native messaging, platform-agnostic |
| **Session File Management** | ✅ Works | ✅ Works | Standard .NET IO |

## Why is OIDC .NET Framework Only?

OpenID Connect in this project uses **OWIN middleware** (`Microsoft.Owin.Security.OpenIdConnect`), which:

- Was designed for .NET Framework and ASP.NET (System.Web)
- Does not support .NET Core/.NET 5+
- Has been replaced by ASP.NET Core middleware in modern .NET

### Alternative for .NET 8.0

If you need OIDC on .NET 8.0, you would need to:

1. Migrate to ASP.NET Core
2. Use `Microsoft.AspNetCore.Authentication.OpenIdConnect`
3. Rewrite the application for ASP.NET Core MVC

This would be a significant rewrite and is beyond the scope of this demonstration.

## Recommended Setup

### For Full Features (SAML + OIDC)

**Use .NET Framework 4.8:**
```bash
# Open in Visual Studio
Open auth-service/AuthService.sln
Press F5
```

You get:
- ✅ SAML 2.0 authentication
- ✅ OpenID Connect authentication
- ✅ Dual login options on home page
- ✅ All extension and desktop app features

### For Cross-Platform (SAML Only)

**Use .NET 8.0:**
```bash
cd auth-service/AuthService
dotnet run
```

You get:
- ✅ SAML 2.0 authentication
- ✅ All extension and desktop app features
- ❌ No OIDC option (button won't appear)

## UI Behavior

The UI automatically adapts based on the runtime:

### .NET Framework 4.8
Shows both login buttons:
- "Login with SAML 2.0" (blue)
- "Login with OpenID Connect" (green)

### .NET 8.0
Shows single login button:
- "Login with SAML 2.0" (blue)

Note: Currently the UI doesn't auto-detect the runtime, so OIDC button shows on both. To properly implement runtime detection, you would add conditional compilation or runtime checks.

## Multi-Targeting

To enable true multi-targeting where the project can build for both frameworks from one codebase:

### Convert to SDK-Style Project

Current: Old-style .csproj
```xml
<Project ToolsVersion="15.0" DefaultTargets="Build">
  ...
</Project>
```

Would need: SDK-style .csproj
```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFrameworks>net48;net8.0</TargetFrameworks>
  </PropertyGroup>
</Project>
```

### Conditional Compilation

Use preprocessor directives for platform-specific code:

```csharp
#if NET48
    // OWIN/OIDC code here
    app.UseOpenIdConnectAuthentication(...);
#elif NET8_0
    // Alternative or skip
#endif
```

### Challenges

- ASP.NET MVC (Framework) vs ASP.NET Core MVC (Core) are different
- System.Web doesn't exist in .NET Core
- Would require significant refactoring

## Current Implementation

The current implementation:
- ✅ Uses packages compatible with both platforms (Sustainsys.Saml2)
- ✅ Includes OWIN packages for .NET Framework 4.8
- ✅ Can be built targeting either framework (change TargetFramework in .csproj)
- ❌ Does not use multi-targeting (single target at a time)
- ❌ Does not auto-hide OIDC on .NET 8.0 (manual awareness required)

## Production Recommendations

For production use:

1. **Stick with .NET Framework 4.8** if you need both SAML and OIDC
2. **Migrate to ASP.NET Core** if you want .NET 8.0 benefits:
   - Better performance
   - Cross-platform hosting (Linux, Docker)
   - Modern framework features
   - Requires rewriting OIDC using ASP.NET Core authentication

3. **Use only SAML** if you want to maintain .NET Framework but need cross-platform option later

## Testing Both Platforms

### Test on .NET Framework 4.8

1. Open Visual Studio
2. Ensure TargetFramework is `net48` in .csproj
3. Build and run
4. Test both SAML and OIDC login flows

### Test on .NET 8.0

1. Change TargetFramework to `net8.0` in .csproj
2. Run `dotnet build`
3. Run `dotnet run`
4. Test SAML login (OIDC will fail if attempted)

**Note**: Switching between frameworks requires editing the .csproj file manually since this isn't a multi-targeted project.
