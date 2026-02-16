# Unified Authentication App

The SAML and OIDC service providers have been merged into a single unified authentication application that supports both SAML 2.0 and OpenID Connect.

## Architecture

The unified app (`dotnet-saml-service-provider/DotNetFrameworkSamlSP`) now supports:

- **SAML 2.0** - Using Sustainsys.Saml2 library
- **OpenID Connect (OIDC)** - Using Microsoft.Owin.Security.OpenIdConnect

## Features

### Dual Authentication Methods

Users can choose between two authentication protocols:

1. **SAML 2.0** (`/Auth/Login`) - Enterprise SSO standard
2. **OpenID Connect** (`/Oidc/Login`) - Modern OAuth 2.0 based authentication

### Unified Features

Both authentication methods support:

- ✅ Extension communication for centralized session storage
- ✅ Desktop app integration via native messaging
- ✅ Web app integration via extension API
- ✅ Session file writing for `returnType=token` parameter
- ✅ 24-hour session expiration
- ✅ Logout functionality

## Controllers

### AuthController (SAML)

- `GET /Auth/Login` - Initiate SAML authentication
- `POST /Auth/Callback` - SAML assertion consumer service
- `GET /Auth/Logout` - SAML logout

### OidcController (OpenID Connect)

- `GET /Oidc/Login` - Initiate OIDC authentication
- `GET /Oidc/Callback` - OIDC callback endpoint
- `GET /Oidc/Logout` - OIDC logout

## Configuration

### SAML Configuration

In `Web.config`:

```xml
<sustainsys.saml2 entityId="dotnet-framework-saml-sp"
                  returnUrl="https://localhost:44300/">
  <identityProviders>
    <add entityId="https://sts.windows.net/{tenantId}/"
         metadataLocation="https://login.microsoftonline.com/{tenantId}/federationmetadata/..."
         ... />
  </identityProviders>
</sustainsys.saml2>
```

### OIDC Configuration

In `secrets.config`:

```xml
<add key="ida:ClientId" value="YOUR_OIDC_CLIENT_ID" />
<add key="ida:ClientSecret" value="YOUR_OIDC_CLIENT_SECRET" />
<add key="ida:TenantId" value="YOUR_TENANT_ID" />
<add key="ida:RedirectUri" value="https://localhost:44300/" />
```

OIDC uses OWIN middleware configured in `App_Start/Startup.Auth.cs`.

## Authentication Flow

### SAML Flow

1. User clicks "Login with SAML 2.0"
2. Redirected to `/Auth/Login`
3. Sustainsys.Saml2 creates SAML request
4. User authenticates with Azure AD
5. SAML assertion returned to `/Saml2/Acs`
6. `AuthController.Callback` processes assertion
7. Session saved to extension and file
8. LoginSuccess page displayed

### OIDC Flow

1. User clicks "Login with OpenID Connect"
2. Redirected to `/Oidc/Login`
3. OWIN middleware initiates OIDC flow
4. User authenticates with Azure AD
5. ID token and code returned to `/Oidc/Callback`
6. `OidcController.Callback` processes tokens
7. Session saved to extension and file
8. LoginSuccess page displayed

## Desktop App Integration

Both SAML and OIDC support desktop app integration:

1. Desktop app opens browser with `?returnType=token`
2. User chooses SAML or OIDC
3. After authentication, session written to file
4. Desktop app polls and detects session
5. Desktop app shows authenticated user

## Web App Integration

Both authentication methods integrate seamlessly with the dummy web app:

1. Web app checks extension for session
2. Extension validates session (regardless of auth method)
3. If valid, web app shows authenticated
4. If not, web app redirects to auth app home page
5. User chooses SAML or OIDC

## NuGet Packages Added

The following OIDC packages were added to the SAML project:

- `Microsoft.Owin` (4.2.2)
- `Microsoft.Owin.Host.SystemWeb` (4.2.2)
- `Microsoft.Owin.Security` (4.2.2)
- `Microsoft.Owin.Security.Cookies` (4.2.2)
- `Microsoft.Owin.Security.OpenIdConnect` (4.2.2)
- `Microsoft.IdentityModel.Protocols.OpenIdConnect` (5.7.0)
- `System.IdentityModel.Tokens.Jwt` (5.7.0)
- `Owin` (1.0)

## Files Added

- `Startup.cs` - OWIN startup class
- `App_Start/Startup.Auth.cs` - OIDC authentication configuration
- `Controllers/OidcController.cs` - OIDC authentication controller

## Files Modified

- `Views/Home/Index.cshtml` - Added OIDC login button
- `Views/Auth/LoginSuccess.cshtml` - Shows authentication method
- `Controllers/AuthController.cs` - Added AuthType to ViewBag
- `packages.config` - Added OIDC NuGet packages

## Benefits of Unified App

1. **Single Deployment** - One app to deploy and maintain
2. **Shared Infrastructure** - Common extension integration, session management
3. **User Choice** - Let users pick their preferred authentication method
4. **Consistent UX** - Same UI for both authentication methods
5. **Easier Testing** - Test both protocols in one application

## Migration from Separate Apps

The old `oidc-service-provider` folder can now be archived or deleted. All functionality has been moved to the unified `dotnet-saml-service-provider/DotNetFrameworkSamlSP` project.

## Testing

To test both authentication methods:

1. Start the unified app (F5 in Visual Studio)
2. Navigate to `https://localhost:44300`
3. Click "Login with SAML 2.0" to test SAML flow
4. Logout
5. Click "Login with OpenID Connect" to test OIDC flow
6. Verify both methods save sessions to extension
7. Test desktop app integration with both methods

## Troubleshooting

### OIDC not working

- Verify `secrets.config` has correct OIDC credentials
- Check Azure AD app registration redirect URIs include `https://localhost:44300/`
- Ensure OWIN packages are installed (`dotnet restore`)

### SAML not working

- Verify SAML metadata URL is correct in `Web.config`
- Check Azure AD app configuration for SAML
- Ensure certificates are configured if required

### Both methods show errors

- Check `Web.config` references `secrets.config` correctly
- Verify HTTPS is enabled (required for both SAML and OIDC)
- Check Application Event Log for detailed errors
