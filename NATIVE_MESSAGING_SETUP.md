# Native Messaging Setup Guide

This guide explains how to set up native messaging between the Chrome extension and the desktop application.

## What is Native Messaging?

Native messaging allows Chrome extensions to communicate with native applications installed on the user's computer. This is how the desktop app can communicate with the browser extension.

## Quick Setup Steps

### 1. Get Your Extension ID

1. Open Chrome and go to `chrome://extensions`
2. Find "Centralized Auth Extension"
3. Copy the ID (looks like: `abcdefghijklmnopqrstuvwxyz123456`)

### 2. Update Extension ID Everywhere

Once you have the extension ID, you need to update it in several places:

**A. Dummy Web App:**
- File: `dummy-web-app/auth.js`
- Line 3: Replace `YOUR_EXTENSION_ID_HERE` with your actual extension ID

**B. Native Messaging Manifest:**
- Will be updated automatically by the install script

**C. Auth App LoginSuccess page:**
- No changes needed (uses internal messaging)

### 3. Install Native Messaging Host

Run PowerShell as Administrator and execute:

```powershell
cd D:\repos\SamlSsoPlayground\native-messaging-host
.\install-native-host.ps1 -ExtensionId "YOUR_EXTENSION_ID_HERE"
```

Replace `YOUR_EXTENSION_ID_HERE` with your actual extension ID.

This script will:
- Update the manifest with your extension ID
- Register the native messaging host with Chrome
- Create the necessary registry entries

### 4. Update Extension to Support Native Messaging

Add this to `auth-extension/background.js`:

```javascript
// Connect to native messaging host (for desktop app communication)
let nativePort = null;

function connectToNativeHost() {
    nativePort = chrome.runtime.connectNative('com.saml.authhost');

    nativePort.onMessage.addListener((message) => {
        console.log('Received from native app:', message);
        // Handle messages from desktop app
    });

    nativePort.onDisconnect.addListener(() => {
        console.log('Disconnected from native host');
        nativePort = null;
    });
}

// Try to connect when extension loads
connectToNativeHost();
```

## Current Issue: Extension Not Saving Session

The extension shows "Not Authenticated" even after login because the web page can't communicate with the extension using `chrome.runtime.sendMessage`.

### Why This Happens

Chrome Manifest V3 extensions can't directly receive messages from web pages via `chrome.runtime.sendMessage` unless they're in the same context.

### Solutions

**Option 1: Use Window PostMessage (Recommended for Now)**

Instead of trying to communicate directly, use `window.postMessage`:

1. Extension injects a content script
2. Web page sends message via `window.postMessage`
3. Content script receives it and forwards to background
4. Background saves the session

**Option 2: Use Extension's Own Page**

Open the auth callback in the extension's context:
- Auth app redirects to `chrome-extension://YOUR_ID/callback.html?user=...`
- Callback page saves to storage
- Redirects back to web app

**Option 3: Manual Copy-Paste**

For testing:
1. After login, show user's session data
2. User copies it
3. Opens extension popup
4. Pastes and saves

## Recommended Fix (Option 1 - PostMessage)

Let me implement this for you if you provide the extension ID.

## Testing Native Messaging

Once set up, you can test the connection:

1. Open DevTools in the extension background page
2. Run: `chrome.runtime.connectNative('com.saml.authhost')`
3. Should see connection or error message

## Troubleshooting

### "Specified native messaging host not found"
- Check registry: `HKEY_CURRENT_USER\Software\Google\Chrome\NativeMessagingHosts\com.saml.authhost`
- Verify manifest path is correct
- Ensure manifest JSON is valid

### "Access to the specified native messaging host is forbidden"
- Check `allowed_origins` in manifest has correct extension ID
- Extension ID must match exactly (including chrome-extension:// prefix)

### Desktop app can't connect
- Native host executable must exist at path in manifest
- App must read from stdin and write to stdout in correct format
- Messages must be length-prefixed JSON

## Next Steps

1. **Get your extension ID** from `chrome://extensions`
2. **Tell me the ID** so I can:
   - Update the web app auth.js
   - Create a content script for the extension
   - Set up proper messaging between web page and extension
3. **Run the install script** to register native messaging
4. **Test the flow**

Let me know your extension ID and I'll implement the proper communication!
