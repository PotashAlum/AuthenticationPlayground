// Popup script - displays authentication status

const AUTH_APP_URL = 'https://localhost:44300';

document.addEventListener('DOMContentLoaded', async () => {
  await checkAuthStatus();

  document.getElementById('loginBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: `${AUTH_APP_URL}/Auth/Login` });
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await logout();
  });
});

async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getSession' });

    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    if (response.session) {
      showAuthenticated(response.session);
    } else {
      showNotAuthenticated();
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    document.getElementById('loading').textContent = 'Error loading status';
  }
}

function showAuthenticated(session) {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status authenticated';
  statusDiv.textContent = 'Authenticated';

  const userInfoDiv = document.getElementById('userInfo');
  userInfoDiv.style.display = 'block';

  const user = session.user || {};
  userInfoDiv.innerHTML = `
    <strong>User Information</strong>
    <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
    <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
    <div><strong>Session Expires:</strong> ${new Date(session.expiresAt).toLocaleString()}</div>
  `;

  document.getElementById('loginBtn').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'block';
}

function showNotAuthenticated() {
  const statusDiv = document.getElementById('status');
  statusDiv.className = 'status not-authenticated';
  statusDiv.textContent = 'Not Authenticated';

  document.getElementById('userInfo').style.display = 'none';
  document.getElementById('loginBtn').style.display = 'block';
  document.getElementById('logoutBtn').style.display = 'none';
}

async function logout() {
  try {
    await chrome.runtime.sendMessage({ action: 'logout' });
    await checkAuthStatus();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}
