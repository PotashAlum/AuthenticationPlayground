# Secrets and Configuration Setup

This project requires sensitive configuration values that should **NOT** be committed to source control.

## Quick Setup

### 1. Copy the example files

```bash
# Copy secrets config for .NET app
cp secrets.config.example secrets.config

# Copy JavaScript config for web apps and extension
cp config.example.js config.js

# Copy native messaging host manifest
cp native-messaging-host/auth-host-manifest.example.json native-messaging-host/auth-host-manifest.json
```

### 2. Update the values in the copied files

#### `secrets.config`

Edit `secrets.config` with your actual Azure AD credentials:

```xml
<?xml version="1.0" encoding="utf-8"?>
<appSettings>
  <add key="AzureTenantId" value="YOUR_ACTUAL_TENANT_ID" />
  <add key="ExtensionId" value="YOUR_ACTUAL_EXTENSION_ID" />
  <add key="SamlEntityId" value="https://localhost:44300/" />
  <add key="AuthAppUrl" value="https://localhost:44300" />

  <!-- OIDC Settings (for oidc-service-provider) -->
  <add key="ida:ClientId" value="YOUR_OIDC_CLIENT_ID" />
  <add key="ida:ClientSecret" value="YOUR_OIDC_CLIENT_SECRET" />
  <add key="ida:TenantId" value="YOUR_ACTUAL_TENANT_ID" />
</appSettings>
```

#### `config.js`

Edit `config.js` with your actual values:

```javascript
const CONFIG = {
  EXTENSION_ID: 'YOUR_ACTUAL_EXTENSION_ID',
  AUTH_APP_URL: 'https://localhost:44300',
  AZURE_TENANT_ID: 'YOUR_ACTUAL_TENANT_ID'
};
```

### 3. Get Your Extension ID

After loading the unpacked extension in Chrome/Edge:

1. Go to `chrome://extensions` (or `edge://extensions`)
2. Enable "Developer mode"
3. Find "Centralized Auth Extension"
4. Copy the ID (shown below the extension name)

#### `native-messaging-host/auth-host-manifest.json`

Edit the manifest with your extension ID and absolute path:

```json
{
    "name":  "com.saml.authhost",
    "description":  "Authentication Native Messaging Host",
    "path":  "C:\\YOUR_ABSOLUTE_PATH\\SamlSsoPlayground\\native-messaging-host\\run-host.bat",
    "type":  "stdio",
    "allowed_origins":  [
        "chrome-extension://YOUR_ACTUAL_EXTENSION_ID/"
    ]
}
```

**Important:** The `path` must be an absolute path to `run-host.bat` on your machine.

### 4. Update Web.config with Tenant ID

The `Web.config` file references `secrets.config` automatically via:

```xml
<appSettings file="..\..\secrets.config">
```

Update the SAML Identity Provider configuration in `Web.config` to use your tenant ID in the metadata URL:

```xml
<identityProviders>
  <add entityId="https://sts.windows.net/YOUR_TENANT_ID/"
       metadataLocation="https://login.microsoftonline.com/YOUR_TENANT_ID/federationmetadata/2007-06/federationmetadata.xml?appid=YOUR_APP_ID"
       ... />
</identityProviders>
```

## Files Ignored by Git

The following files are automatically excluded from version control (see `.gitignore`):

- `secrets.config` - .NET app secrets
- `config.js` - JavaScript configuration
- `native-messaging-host/auth-host-manifest.json` - Native messaging manifest with extension ID
- `auth-extension-session.json` - Runtime session file
- `auth-host-log.txt` - Native messaging host logs

## Files Included in Git

These example files ARE committed to help new developers set up:

- `secrets.config.example` - Template for .NET secrets
- `config.example.js` - Template for JavaScript config
- `native-messaging-host/auth-host-manifest.example.json` - Template for native messaging manifest

## Security Best Practices

1. **Never commit actual secrets** - Always use the `.example` files as templates
2. **Rotate secrets regularly** - If a secret is accidentally committed, rotate it immediately
3. **Use environment-specific configs** - Different values for dev, staging, production
4. **Limit access** - Only share secrets with team members who need them
5. **Use Azure Key Vault** - For production, consider using Azure Key Vault instead of config files

## Updating Secrets

When you need to change secrets:

1. Update `secrets.config` locally
2. Update `config.js` locally
3. Restart the auth app (IIS Express)
4. Reload the browser extension
5. Rebuild the desktop app if needed

## Troubleshooting

### "Extension not found" errors

- Check that your Extension ID in `secrets.config` and `config.js` matches the actual extension ID
- Reload the extension in Chrome/Edge
- Make sure you're accessing the web app from `localhost` (not `127.0.0.1`)

### "Could not communicate with extension"

- Verify the extension ID is correct
- Check that the extension is loaded and active
- Open the extension's background service worker console for errors

### SAML authentication fails

- Verify the Azure Tenant ID is correct in `secrets.config`
- Check that the metadata URL in `Web.config` uses the correct tenant ID
- Ensure your Azure AD app is configured with the correct redirect URIs
