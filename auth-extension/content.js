// Content script - bridges communication between web pages and extension background

console.log('Auth Extension content script loaded');

// Listen for messages from the web page
window.addEventListener('message', (event) => {
    // Only accept messages from same origin
    if (event.source !== window) {
        return;
    }

    // Check if it's an auth-related message
    if (event.data.type && event.data.type === 'AUTH_TO_EXTENSION') {
        console.log('Content script received message from page:', event.data);

        // Forward to background script
        chrome.runtime.sendMessage(event.data.payload, (response) => {
            console.log('Response from background:', response);

            // Send response back to web page
            window.postMessage({
                type: 'AUTH_FROM_EXTENSION',
                payload: response
            }, '*');
        });
    }
});

// Let the page know the extension is available
window.postMessage({
    type: 'AUTH_EXTENSION_READY',
    extensionId: chrome.runtime.id
}, '*');
