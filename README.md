# SAML SSO Playground

A comprehensive demonstration of SAML 2.0 and OpenID Connect authentication with centralized session management via browser extension and native messaging.

## 🏗️ Architecture

This project demonstrates a centralized authentication system with:

- **Auth Service** - Dual-protocol authentication service
  - SAML 2.0: .NET Framework 4.8 & .NET 8.0
  - OpenID Connect: .NET Framework 4.8 only
- **Browser Extension** - Chrome/Edge extension for centralized session storage
- **Web App** - Dummy web application using extension authentication
- **Desktop App** - WPF application using native messaging for authentication
- **Native Messaging Host** - Bridge between desktop app and browser extension

## 🔒 Security & Secrets

**IMPORTANT:** This project uses configuration files to store sensitive information that should **NOT** be committed to source control.

See [SECRETS_SETUP.md](SECRETS_SETUP.md) for detailed instructions on setting up your local secrets.

### Quick Setup

1. Copy example files:
   ```bash
   cp secrets.config.example secrets.config
   cp config.example.js config.js
   cp native-messaging-host/auth-host-manifest.example.json native-messaging-host/auth-host-manifest.json
   ```

2. Update with your actual values:
   - Azure AD Tenant ID
   - Browser Extension ID
   - OIDC Client ID and Secret
   - Absolute paths for native messaging

3. See [SECRETS_SETUP.md](SECRETS_SETUP.md) for complete setup guide

## 📁 Project Structure

```
SamlSsoPlayground/
├── auth-service/                      # Main SAML auth app (multi-platform)
│   └── AuthService/
├── auth-extension/                    # Browser extension
│   ├── manifest.json
│   ├── background.js
│   └── popup.html
├── dummy-web-app/                     # Demo web application
│   ├── index.html
│   └── auth.js
├── dummy-desktop-app/                 # WPF desktop application
│   └── MainWindow.xaml.cs
├── native-messaging-host/             # Native messaging bridge
│   ├── Program.cs
│   ├── run-host.bat
│   └── auth-host-manifest.json
├── secrets.config                     # ⚠️ NOT in git - local secrets
├── secrets.config.example             # Template for secrets
├── config.js                          # ⚠️ NOT in git - JS config
└── config.example.js                  # Template for JS config
```

## 🚀 Getting Started

### Prerequisites

- Visual Studio 2019 or later
- .NET Framework 4.8
- .NET 8 SDK
- Chrome or Edge browser
- Azure AD tenant with app registrations

### 1. Set Up Azure AD

Create app registrations in Azure AD:
- **SAML App** - For SAML 2.0 authentication (Enterprise Application)
- **OIDC App** - For OpenID Connect authentication (App Registration)

### 2. Configure Secrets

Follow the [SECRETS_SETUP.md](SECRETS_SETUP.md) guide to set up your local configuration files.

### 3. Run the Auth Service

**Option A: .NET Framework 4.8 (Visual Studio) - SAML + OIDC**
1. Open `auth-service/AuthService.sln` in Visual Studio
2. Press F5 to run with IIS Express
3. Navigate to `https://localhost:44300`
4. Both SAML and OIDC login options available

**Option B: .NET 8.0 (Command Line) - SAML Only**
1. `cd auth-service/AuthService`
2. `dotnet run`
3. Navigate to the URL shown in the console
4. Only SAML login available (OIDC requires .NET Framework)

### 4. Load the Extension

1. Open Chrome/Edge and go to `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `auth-extension` folder
5. Copy the Extension ID

### 5. Update Configuration

Update your `secrets.config`, `config.js`, and `auth-host-manifest.json` with the Extension ID.

### 6. Register Native Messaging Host

Run as administrator:
```cmd
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.saml.authhost" /ve /t REG_SZ /d "D:\repos\SamlSsoPlayground\native-messaging-host\auth-host-manifest.json" /f
```

(Adjust path to your actual location)

### 7. Run the Desktop App

1. Build: `dotnet build -c Release`
2. Run: `.\dummy-desktop-app\bin\Release\net8.0-windows\DummyDesktopApp.exe`

## 🔐 Authentication Flow

### Web App Flow
1. Web app checks extension for existing session
2. If no session, opens auth app for SAML login
3. Auth app redirects to Azure AD
4. User authenticates with Azure AD
5. Auth app receives SAML assertion
6. Auth app saves session to extension
7. Extension stores session in Chrome storage
8. Web app retrieves session from extension

### Desktop App Flow
1. Desktop app spawns native messaging host
2. Native messaging host reads session file
3. If session exists, desktop app shows user info
4. If no session, desktop app opens browser for login
5. After login, extension writes session to file
6. Desktop app polls and detects session

## 🛠️ Technologies

- **Backend**: ASP.NET MVC 5
- **SAML**: Sustainsys.Saml2 (multi-platform: .NET Framework & .NET Core)
- **OIDC**: Microsoft.Owin.Security.OpenIdConnect (.NET Framework only)
- **Desktop**: WPF (.NET 8)
- **Browser**: Chrome Extension Manifest V3
- **IPC**: Chrome Native Messaging Protocol

## 🔧 Multi-Platform Support

The Auth Service offers flexible platform support:

| Feature | .NET Framework 4.8 | .NET 8.0 |
|---------|-------------------|----------|
| **SAML 2.0** | ✅ Supported | ✅ Supported |
| **OpenID Connect** | ✅ Supported | ❌ Not available* |
| **Extension Integration** | ✅ Yes | ✅ Yes |
| **Desktop App Support** | ✅ Yes | ✅ Yes |
| **Runtime** | IIS/IIS Express | Kestrel |

*OIDC uses OWIN middleware which is .NET Framework-only

**Recommended**: Run on .NET Framework 4.8 to get both SAML and OIDC support.

## 📝 License

This is a demonstration project for educational purposes.

## 🤝 Contributing

This is a playground project. Feel free to fork and experiment!

## ⚠️ Security Notes

- Never commit `secrets.config`, `config.js`, or `auth-host-manifest.json`
- Rotate secrets if accidentally committed
- Use Azure Key Vault for production
- HTTPS is required for SameSite cookies
- Extension ID should be treated as semi-sensitive
