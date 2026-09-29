// Authentication logic for dummy web application

const AUTH_APP_URL = window.APP_CONFIG?.AUTH_APP_URL || 'https://localhost:44300';

let authenticated = false;
let userInfo = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await checkAuthentication();
});

function setupEventListeners() {
    document.getElementById('logoutBtn').addEventListener('click', logout);
}

async function checkAuthentication() {
    showStatus('loading', 'Checking authentication status...');

    // Check if we have session data from URL params (returned from auth service)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionData = urlParams.get('session');

    if (sessionData) {
        // We have session data from auth service, save it and show authenticated
        try {
            const session = JSON.parse(decodeURIComponent(sessionData));
            console.log('Received session from auth service:', session);
            showAuthenticated(session.user, session.authType);
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        } catch (error) {
            console.error('Error parsing session data:', error);
        }
    }

    // No session data in URL, redirect to auth service
    console.log('No session data, redirecting to auth service');
    window.location.href = `${AUTH_APP_URL}/Auth/Login`;
}

async function logout() {
    // Redirect to auth service logout
    window.location.href = `${AUTH_APP_URL}/Auth/Logout`;
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

function showAuthenticated(user, authType) {
    authenticated = true;
    userInfo = user;

    showStatus('authenticated', 'Authenticated successfully!');

    const userInfoDiv = document.getElementById('userInfo');
    userInfoDiv.style.display = 'block';

    document.getElementById('userDetails').innerHTML = `
        <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
        <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
        ${authType ? `<div><strong>Auth Method:</strong> ${authType}</div>` : ''}
    `;

    document.getElementById('logoutBtn').style.display = 'inline-block';
}
