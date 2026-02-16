// Authentication logic for dummy web application

const EXTENSION_ID = window.APP_CONFIG?.EXTENSION_ID || 'YOUR_EXTENSION_ID';
const AUTH_APP_URL = window.APP_CONFIG?.AUTH_APP_URL || 'https://localhost:44300';

let extensionInstalled = false;
let authenticated = false;
let userInfo = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await checkAuthentication();
});

function setupEventListeners() {
    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('checkExtensionBtn').addEventListener('click', checkExtension);
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

async function checkAuthentication() {
    showStatus('loading', 'Checking authentication status...');

    // First, check if extension is installed
    const isInstalled = await checkExtensionInstalled();

    if (isInstalled) {
        // Extension is installed, request token
        await authenticateWithExtension();
    } else {
        // Extension not installed, show manual login option
        showNotAuthenticated('Extension not installed. Please install the Auth Extension or login manually.');
        document.getElementById('extensionInfo').style.display = 'block';
        document.getElementById('extensionStatus').textContent = 'The centralized auth extension is not installed. You can either install the extension or proceed with manual login.';
    }
}

async function checkExtensionInstalled() {
    try {
        // Try to communicate with extension using externally_connectable
        const response = await sendMessageToExtension({ action: 'ping' });
        extensionInstalled = response && response.installed === true;
        return extensionInstalled;
    } catch (error) {
        console.log('Extension not installed:', error);
        extensionInstalled = false;
        return false;
    }
}

async function sendMessageToExtension(message) {
    return new Promise((resolve, reject) => {
        if (typeof chrome === 'undefined' || !chrome.runtime) {
            reject(new Error('Chrome runtime not available'));
            return;
        }

        // Try with hardcoded extension ID first
        // In production, you'd need to know the extension ID
        // For development, you can get it from chrome://extensions
        chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(response);
            }
        });
    });
}

async function authenticateWithExtension() {
    try {
        // Check if session exists in extension
        const sessionCheck = await sendMessageToExtension({ action: 'checkSession' });

        if (sessionCheck && sessionCheck.authenticated) {
            // User is authenticated
            showAuthenticated(sessionCheck.user);
            return;
        }

        // No session, request token
        const tokenResponse = await sendMessageToExtension({ action: 'requestToken' });

        if (tokenResponse && tokenResponse.success) {
            // Got a token, validate it with backend
            await validateToken(tokenResponse.token);
        } else {
            // Need to login, open auth app
            showNotAuthenticated('Not authenticated. Please login.');
        }
    } catch (error) {
        console.error('Error authenticating with extension:', error);
        showError('Failed to communicate with extension.');
    }
}

async function validateToken(token) {
    try {
        // In a real app, you would send this token to your backend
        // For this demo, we'll just mark as authenticated
        showStatus('loading', 'Validating token...');

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));

        // Mock successful validation
        const mockUser = {
            name: 'John Doe',
            email: 'john@example.com'
        };

        showAuthenticated(mockUser);
    } catch (error) {
        console.error('Error validating token:', error);
        showError('Failed to validate authentication token.');
    }
}

async function login() {
    if (extensionInstalled) {
        // Open auth app with returnType=token
        window.open(`${AUTH_APP_URL}/Auth/Login?returnType=token`, '_blank');

        // Poll for authentication
        showStatus('loading', 'Waiting for authentication...');
        pollForAuthentication();
    } else {
        // Open auth app normally
        window.location.href = `${AUTH_APP_URL}/Auth/Login`;
    }
}

function pollForAuthentication() {
    const pollInterval = setInterval(async () => {
        try {
            const sessionCheck = await sendMessageToExtension({ action: 'checkSession' });

            if (sessionCheck && sessionCheck.authenticated) {
                clearInterval(pollInterval);
                showAuthenticated(sessionCheck.user);
            }
        } catch (error) {
            // Extension might not be responding, stop polling after some attempts
            console.error('Polling error:', error);
        }
    }, 2000);

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(pollInterval), 120000);
}

async function checkExtension() {
    showStatus('loading', 'Checking extension...');
    const isInstalled = await checkExtensionInstalled();

    if (isInstalled) {
        document.getElementById('extensionInfo').style.display = 'block';
        document.getElementById('extensionStatus').textContent = 'Extension is installed and working!';
        showStatus('authenticated', 'Extension detected successfully!');
    } else {
        document.getElementById('extensionInfo').style.display = 'block';
        document.getElementById('extensionStatus').textContent = 'Extension is not installed. Please install it from chrome://extensions';
        showStatus('error', 'Extension not detected.');
    }
}

async function logout() {
    if (extensionInstalled) {
        try {
            await sendMessageToExtension({ action: 'logout' });
        } catch (error) {
            console.error('Error logging out from extension:', error);
        }
    }

    // Clear local state
    authenticated = false;
    userInfo = null;

    showNotAuthenticated('Logged out successfully.');
}

function showStatus(type, message) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status ${type}`;

    if (type === 'loading') {
        statusDiv.innerHTML = `<div class="spinner"></div><span>${message}</span>`;
    } else {
        statusDiv.textContent = message;
    }
}

function showAuthenticated(user) {
    authenticated = true;
    userInfo = user;

    showStatus('authenticated', 'Authenticated successfully!');

    const userInfoDiv = document.getElementById('userInfo');
    userInfoDiv.style.display = 'block';

    document.getElementById('userDetails').innerHTML = `
        <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
        <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
    `;

    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('checkExtensionBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
}

function showNotAuthenticated(message) {
    authenticated = false;
    userInfo = null;

    showStatus('not-authenticated', message);

    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('checkExtensionBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'none';
}

function showError(message) {
    showStatus('error', message);
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('checkExtensionBtn').style.display = 'inline-block';
}
