// Background service worker - handles authentication state and token generation

const AUTH_APP_URL = 'https://localhost:44300';
const TOKEN_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Store active one-time tokens
const activeTokens = new Map();

// Listen for messages from web pages and desktop apps
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('Received external message:', request);

  if (request.action === 'checkSession') {
    handleCheckSession(sendResponse);
    return true; // Will respond asynchronously
  }

  if (request.action === 'requestToken') {
    handleRequestToken(sendResponse);
    return true;
  }

  if (request.action === 'ping') {
    sendResponse({ installed: true });
    return true;
  }

  if (request.action === 'saveSession') {
    handleSaveSession(request.session, sendResponse);
    return true;
  }
});

// Listen for messages from popup and auth app
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received internal message:', request);

  if (request.action === 'getSession') {
    handleGetSession(sendResponse);
    return true;
  }

  if (request.action === 'saveSession') {
    handleSaveSession(request.session, sendResponse);
    return true;
  }

  if (request.action === 'logout') {
    handleLogout(sendResponse);
    return true;
  }

  if (request.action === 'validateToken') {
    handleValidateToken(request.token, sendResponse);
    return true;
  }
});

// Check if session exists
async function handleCheckSession(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['session']);
    const session = result.session;

    if (session && session.expiresAt > Date.now()) {
      sendResponse({
        authenticated: true,
        user: session.user
      });
    } else {
      sendResponse({ authenticated: false });
    }
  } catch (error) {
    console.error('Error checking session:', error);
    sendResponse({ authenticated: false, error: error.message });
  }
}

// Get full session data
async function handleGetSession(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['session']);
    const session = result.session;

    if (session && session.expiresAt > Date.now()) {
      sendResponse({ session });
    } else {
      sendResponse({ session: null });
    }
  } catch (error) {
    console.error('Error getting session:', error);
    sendResponse({ session: null, error: error.message });
  }
}

// Save session after successful authentication
async function handleSaveSession(session, sendResponse) {
  try {
    // Add expiration time (24 hours)
    const sessionWithExpiry = {
      ...session,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    };

    await chrome.storage.local.set({ session: sessionWithExpiry });
    console.log('Session saved successfully');

    // Notify native host to update session file
    if (nativePort) {
      nativePort.postMessage({
        action: 'updateSession',
        session: sessionWithExpiry
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error saving session:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Generate one-time token for login
async function handleRequestToken(sendResponse) {
  try {
    const result = await chrome.storage.local.get(['session']);
    const session = result.session;

    if (!session || session.expiresAt <= Date.now()) {
      // No valid session, client should open auth app
      sendResponse({
        success: false,
        authUrl: `${AUTH_APP_URL}/Auth/Login?returnType=token`
      });
      return;
    }

    // Verify IdP session is still active using SAML IsPassive
    const idpSessionValid = await checkIdPSession();

    if (!idpSessionValid) {
      // IdP session expired, clear local session
      await chrome.storage.local.remove(['session']);
      sendResponse({
        success: false,
        sessionExpired: true,
        authUrl: `${AUTH_APP_URL}/Auth/Login?returnType=token`
      });
      return;
    }

    // Generate one-time token
    const token = generateToken();
    activeTokens.set(token, {
      session: session,
      createdAt: Date.now(),
      expiresAt: Date.now() + TOKEN_EXPIRY_MS,
      used: false
    });

    // Clean up expired tokens
    cleanupExpiredTokens();

    sendResponse({
      success: true,
      token: token,
      expiresIn: TOKEN_EXPIRY_MS
    });
  } catch (error) {
    console.error('Error requesting token:', error);
    sendResponse({
      success: false,
      error: error.message,
      authUrl: `${AUTH_APP_URL}/Auth/Login?returnType=token`
    });
  }
}

// Validate and consume one-time token
async function handleValidateToken(token, sendResponse) {
  try {
    const tokenData = activeTokens.get(token);

    if (!tokenData) {
      sendResponse({ valid: false, error: 'Token not found' });
      return;
    }

    if (tokenData.used) {
      activeTokens.delete(token);
      sendResponse({ valid: false, error: 'Token already used' });
      return;
    }

    if (tokenData.expiresAt <= Date.now()) {
      activeTokens.delete(token);
      sendResponse({ valid: false, error: 'Token expired' });
      return;
    }

    // Mark token as used and delete it
    tokenData.used = true;
    activeTokens.delete(token);

    sendResponse({
      valid: true,
      session: tokenData.session
    });
  } catch (error) {
    console.error('Error validating token:', error);
    sendResponse({ valid: false, error: error.message });
  }
}

// Logout - clear session
async function handleLogout(sendResponse) {
  try {
    await chrome.storage.local.remove(['session']);
    // Clear all active tokens
    activeTokens.clear();
    console.log('Session cleared');

    // Notify native host to clear session file
    if (nativePort) {
      nativePort.postMessage({
        action: 'clearSession'
      });
    }

    sendResponse({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Generate random token
function generateToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Clean up expired tokens
function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of activeTokens.entries()) {
    if (data.expiresAt <= now) {
      activeTokens.delete(token);
    }
  }
}

// Check if IdP session is still active using SAML IsPassive
async function checkIdPSession() {
  return new Promise((resolve) => {
    // Create an offscreen document or use an iframe to check IdP session
    // We'll create a hidden tab that performs IsPassive authentication
    chrome.tabs.create(
      {
        url: `${AUTH_APP_URL}/SessionCheck/Verify`,
        active: false
      },
      (tab) => {
        const tabId = tab.id;
        let resolved = false;

        // Listen for navigation to callback URL
        const listener = (details) => {
          if (details.tabId === tabId && !resolved) {
            resolved = true;

            // Check if we got success or failure
            if (details.url.includes('/SessionCheck/Success')) {
              chrome.tabs.remove(tabId);
              chrome.webNavigation.onCompleted.removeListener(listener);
              resolve(true);
            } else if (details.url.includes('/SessionCheck/Failure')) {
              chrome.tabs.remove(tabId);
              chrome.webNavigation.onCompleted.removeListener(listener);
              resolve(false);
            }
          }
        };

        chrome.webNavigation.onCompleted.addListener(listener);

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            chrome.tabs.remove(tabId);
            chrome.webNavigation.onCompleted.removeListener(listener);
            resolve(false); // Assume session expired on timeout
          }
        }, 10000);
      }
    );
  });
}

// Periodic cleanup every minute
setInterval(cleanupExpiredTokens, 60 * 1000);

// Native Messaging Support for Desktop Apps
let nativePort = null;

function connectToNativeHost() {
  try {
    nativePort = chrome.runtime.connectNative('com.saml.authhost');

    nativePort.onMessage.addListener((message) => {
      console.log('Received from native host:', message);
      // Handle messages from desktop app via native host
      if (message.action === 'checkSession') {
        handleCheckSessionFromNative();
      }
    });

    nativePort.onDisconnect.addListener(() => {
      console.log('Disconnected from native host');
      if (chrome.runtime.lastError) {
        console.log('Native host error:', chrome.runtime.lastError.message);
      }
      nativePort = null;
    });

    console.log('Connected to native messaging host');
  } catch (error) {
    console.log('Failed to connect to native host:', error);
  }
}

async function handleCheckSessionFromNative() {
  try {
    const result = await chrome.storage.local.get(['session']);
    const session = result.session;

    if (session && session.expiresAt > Date.now()) {
      nativePort.postMessage({
        authenticated: true,
        user: session.user
      });
    } else {
      nativePort.postMessage({
        authenticated: false
      });
    }
  } catch (error) {
    console.error('Error checking session for native:', error);
    nativePort.postMessage({
      authenticated: false,
      error: error.message
    });
  }
}

// Try to connect on startup
connectToNativeHost();

// Retry connection every 5 seconds if not connected
setInterval(() => {
  if (!nativePort) {
    connectToNativeHost();
  }
}, 5000);

console.log('Auth extension background service worker loaded');
