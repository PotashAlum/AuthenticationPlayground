# OIDC Service Provider - Microsoft Entra ID

ASP.NET MVC (.NET Framework 4.8) application that authenticates users via OpenID Connect with Microsoft Entra ID (Azure AD).

## Prerequisites

- Visual Studio 2019 or later (with ASP.NET and web development workload)
- .NET Framework 4.8 SDK
- A Microsoft Entra ID (Azure AD) tenant

## Entra ID App Registration Setup

### 1. Register the Application

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** > **App registrations** > **New registration**
3. Fill in:
   - **Name**: `OIDC Service Provider` (or any name)
   - **Supported account types**: Choose based on your needs:
     - *Single tenant* — only users in your directory
     - *Multitenant* — users from any Azure AD directory
     - *Multitenant + personal Microsoft accounts* — broadest access
   - **Redirect URI**:
     - Platform: **Web**
     - URI: `https://localhost:44300/`
4. Click **Register**

### 2. Note the Application Values

After registration, from the **Overview** page, copy:
- **Application (client) ID** — this is your `ClientId`
- **Directory (tenant) ID** — this is your `TenantId`

### 3. Create a Client Secret

1. Go to **Certificates & secrets** > **Client secrets** > **New client secret**
2. Add a description (e.g., `dev-secret`) and choose an expiry
3. Click **Add**
4. **Copy the secret Value immediately** (it won't be shown again) — this is your `ClientSecret`

### 4. Configure Token Settings

1. Go to **Token configuration** > **Add optional claim**
2. Select **ID** token type
3. Add these claims: `email`, `given_name`, `family_name`
4. Click **Add** (accept the API permissions prompt if shown)

### 5. Set API Permissions

1. Go to **API permissions**
2. Ensure these are present (they should be by default):
   - `Microsoft Graph` > `openid` (Delegated)
   - `Microsoft Graph` > `profile` (Delegated)
   - `Microsoft Graph` > `email` (Delegated)
3. If your tenant requires it, click **Grant admin consent for [tenant]**

## Configure the Application

Edit `Web.config` and replace the placeholder values in `<appSettings>`:

```xml
<add key="ida:ClientId" value="YOUR_CLIENT_ID" />
<add key="ida:ClientSecret" value="YOUR_CLIENT_SECRET" />
<add key="ida:TenantId" value="YOUR_TENANT_ID" />
<add key="ida:RedirectUri" value="https://localhost:44300/" />
<add key="ida:PostLogoutRedirectUri" value="https://localhost:44300/" />
```

Replace:
- `YOUR_CLIENT_ID` with the Application (client) ID from step 2
- `YOUR_CLIENT_SECRET` with the client secret Value from step 3
- `YOUR_TENANT_ID` with the Directory (tenant) ID from step 2

## Build and Run

1. Open `OidcServiceProvider.sln` in Visual Studio
2. Right-click the solution in Solution Explorer > **Restore NuGet Packages**
3. Press **F5** to build and run
4. The app will open at `https://localhost:44300/`
5. Click **Sign In with Entra ID** to authenticate

## Project Structure

```
├── App_Start/
│   ├── FilterConfig.cs        # Global MVC filters
│   ├── RouteConfig.cs         # URL routing
│   └── Startup.Auth.cs        # OWIN OIDC + cookie auth config
├── Controllers/
│   ├── AccountController.cs   # Sign-in and sign-out actions
│   └── HomeController.cs      # Home page and claims display
├── Views/
│   ├── Home/
│   │   ├── Index.cshtml       # Landing page
│   │   └── Claims.cshtml      # Displays user claims after login
│   ├── Shared/
│   │   └── _Layout.cshtml     # Shared layout template
│   └── _ViewStart.cshtml      # Default layout assignment
├── Global.asax / .cs          # Application entry point
├── Startup.cs                 # OWIN startup
├── Web.config                 # App settings and assembly bindings
└── packages.config            # NuGet package references
```

## How It Works

1. **Unauthenticated user** visits the site and clicks "Sign In"
2. `AccountController.SignIn()` triggers an OIDC challenge
3. The OWIN middleware redirects to `login.microsoftonline.com` with the configured tenant
4. User authenticates with Entra ID and consents (if first time)
5. Entra ID posts back an authorization code + ID token to the redirect URI
6. The middleware validates the tokens and creates a cookie session
7. The user is now authenticated and can view their claims at `/Home/Claims`

## Troubleshooting

| Issue | Solution |
|---|---|
| `IDX20803: Unable to obtain configuration` | Check that `TenantId` is correct and the app can reach `login.microsoftonline.com` |
| `AADSTS50011: Reply URL does not match` | Ensure the redirect URI in Entra ID matches `ida:RedirectUri` in Web.config exactly (including trailing slash) |
| `AADSTS7000218: Request body must contain client_assertion or client_secret` | Verify the client secret is correct and hasn't expired |
| `AADSTS65001: User or admin has not consented` | Grant admin consent in API Permissions, or sign in with an admin account to consent |
| Port conflict on 44300 | Change `IISExpressSSLPort` in the `.csproj` and update the redirect URIs in both Entra ID and Web.config |
