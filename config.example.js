// Copy this file to config.js and fill in your actual values
// DO NOT commit config.js to source control

const CONFIG = {
  EXTENSION_ID: 'YOUR_EXTENSION_ID_HERE',
  AUTH_APP_URL: 'https://localhost:44300',
  AZURE_TENANT_ID: 'YOUR_TENANT_ID_HERE'
};

// For browser usage
if (typeof window !== 'undefined') {
  window.APP_CONFIG = CONFIG;
}

// For Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
