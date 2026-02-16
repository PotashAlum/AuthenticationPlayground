# Centralized Authentication System

This is a complete centralized authentication system that uses a browser extension as the authentication hub. The system consists of four components:

## Components

### 1. Browser Extension (`auth-extension/`)
The centralized authentication hub that stores user sessions and provides one-time tokens.

**Features:**
- Stores authenticated user session in extension storage
- Provides one-time tokens to web and desktop applications
- Session management (24-hour expiration)
- Token validation and consumption

**Key Files:**
- `manifest.json` - Extension configuration
- `background.js` - Service worker handling authentication logic
- `popup.html` / `popup.js` - Extension popup UI

### 2. Auth Web Application (`dotnet-saml-service-provider/`)
ASP.NET MVC application that handles SAML 2.0 authentication with Azure AD.

**Features:**
- SAML 2.0 authentication flow with Azure Entra ID
- Session callback that communicates with extension
- Token-based return flow for extension integration

**Endpoints:**
- `/Auth/Login` - Initiates SAML login
- `/Auth/Callback` - SAML callback handler
- `/Auth/Logout` - Logout handler
- `/Saml2/Acs` - SAML Assertion Consumer Service
- `/Saml2` - SAML metadata endpoint

### 3. Dummy Web Application (`dummy-web-app/`)
Simple web application demonstrating extension integration.

**Features:**
- Checks if extension is installed
- Requests authentication token from extension
- Falls back to manual login if extension not available
- Session management

**Files:**
- `index.html` - Main application page
- `auth.js` - Authentication logic and extension communication

### 4. Dummy Desktop Application (`dummy-desktop-app/`)
WPF desktop application demonstrating extension communication.

**Features:**
- Opens browser for authentication
- Polls for authentication completion
- Native messaging support (for production)
- Session management

**Files:**
- `MainWindow.xaml` - UI layout
- `MainWindow.xaml.cs` - Application logic

## Architecture Flow

### First-Time Authentication:
1. User opens dummy web/desktop app
2. App checks if extension is installed
3. If installed, app checks extension for existing session
4. If no session, app opens auth web app in browser
5. User authenticates via SAML with Azure AD
6. Auth app saves session to extension
7. App detects authentication and validates token

### Subsequent Authentication:
1. User opens dummy web/desktop app
2. App requests token from extension
3. Extension provides one-time token
4. App validates token with backend
5. User is logged in immediately

## Setup Instructions

### Prerequisites
- Windows OS
- Chrome/Edge browser
- Visual Studio 2022
- .NET Framework 4.8
- .NET 8.0 SDK (for desktop app)
- Node.js (for web app server)
- Azure AD tenant with SAML app configured

### 1. Install Browser Extension

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `auth-extension` folder
5. Note the Extension ID (e.g., `abcdefghijklmnopqrstuvwxyz`)
6. Create placeholder icons:
   - Use any 16x16, 48x48, and 128x128 PNG images
   - Save them in `auth-extension/icons/` as `icon16.png`, `icon48.png`, `icon128.png`

### 2. Configure Extension ID

Update the `EXTENSION_ID` in `dummy-web-app/auth.js`:
```javascript
const EXTENSION_ID = 'your_extension_id_here';
```

### 3. Run Auth Web Application

1. Open `dotnet-saml-service-provider/DotNetFrameworkSamlSP.sln` in Visual Studio
2. Press F5 to run (should start on http://localhost:60427)
3. Verify SAML metadata is accessible at http://localhost:60427/Saml2

### 4. Configure Azure AD

1. Go to Azure Portal → Enterprise Applications
2. Create/select your SAML application
3. Configure:
   - **Identifier (Entity ID)**: `dotnet-framework-saml-sp`
   - **Reply URL (ACS)**: `http://localhost:60427/Saml2/Acs`
   - **Sign on URL**: `http://localhost:60427/Auth/Login`
   - **Logout URL**: `http://localhost:60427/Auth/Logout`
4. Download the Federation Metadata XML
5. Update the `metadataLocation` in `Web.config` if needed

### 5. Run Dummy Web Application

```bash
cd dummy-web-app
npm start
```

The app will be available at http://localhost:8080

### 6. Run Dummy Desktop Application

```bash
cd dummy-desktop-app
dotnet run
```

## Usage

### Testing the Flow

1. **Install Extension**: Load the extension in Chrome
2. **Start Auth App**: Run the .NET Framework SAML app
3. **Test Web App**:
   - Open http://localhost:8080
   - Click "Login"
   - Complete SAML authentication
   - Session is saved to extension
   - You're redirected back as authenticated
4. **Test Desktop App**:
   - Run the desktop application
   - Click "Login"
   - Browser opens for authentication
   - Complete SAML login
   - Desktop app polls for session
   - Shows authenticated state

### Extension Popup

Click the extension icon to see:
- Current authentication status
- User information
- Login/Logout buttons

## Security Considerations

### One-Time Tokens
- Tokens expire after 5 minutes
- Tokens can only be used once
- Tokens are deleted after validation

### Session Storage
- Sessions stored in extension's secure storage
- Sessions expire after 24 hours
- Logout clears all sessions and tokens

### Communication
- Extension uses `externally_connectable` to allow specific origins
- Desktop apps should use Chrome Native Messaging in production
- All communication should use HTTPS in production

## Production Deployment

### Extension
1. Package extension for Chrome Web Store
2. Submit for review
3. Update `EXTENSION_ID` in all applications
4. Configure proper `matches` in `externally_connectable`

### Auth Application
1. Deploy to production server with HTTPS
2. Update all URLs to production endpoints
3. Configure production Azure AD SAML app
4. Use production certificates
5. Enable proper session security

### Web Application
1. Deploy to production with HTTPS
2. Update extension ID
3. Update auth app URL
4. Implement proper token validation API

### Desktop Application
1. Implement Chrome Native Messaging host
2. Register native messaging manifest
3. Update auth app URL
4. Sign the application
5. Create installer

## Native Messaging for Desktop Apps

For production desktop apps, implement Chrome Native Messaging:

1. **Create Native Messaging Host**:
```json
{
  "name": "com.yourcompany.authhost",
  "description": "Auth Desktop Host",
  "path": "C:\\path\\to\\your\\host.exe",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://your_extension_id/"
  ]
}
```

2. **Register with Chrome**:
   - Windows: Add registry key at `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.yourcompany.authhost`
   - Value: Path to manifest JSON file

3. **Update Extension**:
```javascript
// In background.js
chrome.runtime.connectNative('com.yourcompany.authhost');
```

4. **Desktop App Communication**:
   - Read JSON messages from stdin
   - Write JSON responses to stdout
   - Handle token requests/responses

## Troubleshooting

### Extension Not Detected
- Verify extension is loaded and enabled
- Check extension ID matches in web app
- Check console for errors
- Verify `externally_connectable` configuration

### SAML Authentication Fails
- Verify Azure AD configuration matches URLs
- Check Web.config SAML settings
- Verify certificates are valid
- Check browser console and server logs

### Desktop App Can't Communicate
- For development, polling is used
- For production, implement native messaging
- Check if browser is running
- Verify extension is installed

### Tokens Not Working
- Check token expiration (5 minutes)
- Verify token hasn't been used already
- Check extension storage for session
- Look at browser console logs

## API Reference

### Extension Messages

**Check Session**:
```javascript
chrome.runtime.sendMessage(extensionId, {
  action: 'checkSession'
}, (response) => {
  // response: { authenticated: boolean, user?: {name, email} }
});
```

**Request Token**:
```javascript
chrome.runtime.sendMessage(extensionId, {
  action: 'requestToken'
}, (response) => {
  // response: { success: boolean, token?: string, authUrl?: string }
});
```

**Save Session** (from auth app):
```javascript
chrome.runtime.sendMessage({
  action: 'saveSession',
  session: {
    user: { name, email },
    authenticatedAt: Date.now()
  }
}, (response) => {
  // response: { success: boolean }
});
```

**Logout**:
```javascript
chrome.runtime.sendMessage(extensionId, {
  action: 'logout'
}, (response) => {
  // response: { success: boolean }
});
```

## License

MIT License - feel free to use for your projects!
