const API_URL = 'http://localhost:3000/api/extension/save';

const pageTitleEl = document.getElementById('pageTitle');
const pageUrlEl = document.getElementById('pageUrl');
const tagsEl = document.getElementById('tags');
const saveBtn = document.getElementById('saveBtn');
const statusText = document.getElementById('statusText');

function showStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.remove('hidden');
  statusText.classList.toggle('text-cyan', !isError);
  statusText.classList.toggle('text-red', isError);
}

function hideStatus() {
  statusText.classList.add('hidden');
  statusText.textContent = '';
}

function setLoading(loading) {
  saveBtn.disabled = loading;
  saveBtn.textContent = loading ? 'Saving...' : 'Save to Brain';
}

// Populate title and URL from current tab
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab) {
      pageTitleEl.value = tab.title || '';
      pageUrlEl.value = tab.url || '';
    } else {
      pageTitleEl.placeholder = 'No tab';
      pageUrlEl.placeholder = 'No tab';
    }
  });
});

// Save to Brain
saveBtn.addEventListener('click', async () => {
  const title = pageTitleEl.value.trim();
  const url = pageUrlEl.value.trim();
  const tagsRaw = tagsEl.value.trim();
  const tags = tagsRaw
    ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  if (!title || !url) {
    showStatus('Missing title or URL.', true);
    return;
  }

  setLoading(true);
  showStatus('Saving...');

  try {
    const { synapseToken } = await chrome.storage.local.get('synapseToken');
    const headers = { 'Content-Type': 'application/json' };
    if (synapseToken) {
      headers['Authorization'] = 'Bearer ' + synapseToken;
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ title, url, tags }),
      credentials: 'include',
    });

    if (!res.ok) {
      const errBody = await res.text();
      let message = errBody || `HTTP ${res.status}`;
      try {
        const j = JSON.parse(errBody);
        if (j && typeof j.error === 'string') message = j.error;
      } catch (_) {}
      throw new Error(message);
    }

    showStatus('Saved!');
    setTimeout(() => window.close(), 1500);
  } catch (err) {
    setLoading(false);
    showStatus(err.message || 'Failed to save.', true);
  }
});
