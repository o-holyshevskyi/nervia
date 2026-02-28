// Signal to the app that the Synapse extension is installed (only runs on matched domains).
document.documentElement.setAttribute('data-synapse-extension', 'installed');

// Listens for the Synapse app page to post the session token, then stores it
// so the popup can send it with save requests (cookies are not sent from extension origin).
window.addEventListener('message', function (event) {
  if (event.source !== window) return;
  const data = event.data;
  if (data && data.type === 'SYNAPSE_EXTENSION_TOKEN' && typeof data.token === 'string') {
    chrome.storage.local.set({ synapseToken: data.token });
  }
});
